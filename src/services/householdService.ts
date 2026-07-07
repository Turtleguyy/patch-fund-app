import { Child } from '../models/Child';
import { LedgerEntry } from '../models/LedgerEntry';
import { WeekSummary } from '../models/WeekSummary';
import { getSupabase } from '../lib/supabase';
import { ChildRow, LedgerEntryRow, WeekSummaryRow } from '../types/database';
import { profileService } from './profileService';
import { storageService } from './storageService';

export interface Household {
  id: string;
  name: string | null;
  inviteCode: string;
}

let activeHouseholdId: string | null = null;

export function setActiveHouseholdId(householdId: string | null): void {
  activeHouseholdId = householdId;
}

export function getActiveHouseholdId(): string | null {
  return activeHouseholdId;
}

function mapChild(row: ChildRow): Child {
  return {
    id: row.id,
    name: row.name,
    weeklyStartingAmount: Number(row.weekly_starting_amount),
    weekStartedAt: row.week_started_at,
  };
}

function mapEntry(row: LedgerEntryRow, memberNames: Map<string, string>): LedgerEntry {
  const loggedByUserId = row.created_by ?? undefined;
  return {
    id: row.id,
    childId: row.child_id,
    amountDelta: Number(row.amount_delta),
    reason: row.reason,
    category: row.category ?? undefined,
    source: row.source,
    createdAt: row.created_at,
    loggedByUserId,
    loggedByName: loggedByUserId ? memberNames.get(loggedByUserId) : undefined,
  };
}

function mapSummary(row: WeekSummaryRow): WeekSummary {
  return {
    id: row.id,
    childId: row.child_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    weeklyStartingAmount: Number(row.weekly_starting_amount),
    endingBalance: Number(row.ending_balance),
  };
}

export const householdService = {
  async getCurrentHousehold(): Promise<Household | null> {
    const supabase = getSupabase();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return null;

    const { data: membership, error: memberError } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!membership) return null;

    const { data: household, error } = await supabase
      .from('households')
      .select('id, name, invite_code')
      .eq('id', membership.household_id)
      .single();

    if (error) throw error;

    const mapped: Household = {
      id: household.id,
      name: household.name,
      inviteCode: household.invite_code,
    };
    setActiveHouseholdId(mapped.id);
    return mapped;
  },

  async createHousehold(name?: string): Promise<Household> {
    const { data, error } = await getSupabase().rpc('create_household', {
      household_name: name?.trim() || null,
    });

    if (error) throw error;
    const row = data?.[0];
    if (!row) throw new Error('Could not create household.');

    const household: Household = {
      id: row.household_id,
      name: name?.trim() || null,
      inviteCode: row.invite_code,
    };
    setActiveHouseholdId(household.id);
    return household;
  },

  async joinHousehold(inviteCode: string): Promise<Household> {
    const { data: householdId, error } = await getSupabase().rpc('join_household_by_code', {
      code: inviteCode.trim(),
    });

    if (error) throw error;

    const { data: household, error: fetchError } = await getSupabase()
      .from('households')
      .select('id, name, invite_code')
      .eq('id', householdId)
      .single();

    if (fetchError) throw fetchError;

    const mapped: Household = {
      id: household.id,
      name: household.name,
      inviteCode: household.invite_code,
    };
    setActiveHouseholdId(mapped.id);
    return mapped;
  },

  async importLocalDataToHousehold(householdId: string): Promise<void> {
    const [localChildren, localEntries, localSummaries] = await Promise.all([
      storageService.getChildren(),
      storageService.getEntries(),
      storageService.getWeekSummaries(),
    ]);

    if (localChildren.length === 0) return;

    const supabase = getSupabase();
    const childIdMap = new Map<string, string>();

    for (const child of localChildren) {
      const { data, error } = await supabase
        .from('children')
        .insert({
          household_id: householdId,
          name: child.name,
          weekly_starting_amount: child.weeklyStartingAmount,
          week_started_at: child.weekStartedAt,
        })
        .select('id')
        .single();

      if (error) throw error;
      childIdMap.set(child.id, data.id);
    }

    const entriesToInsert = localEntries
      .filter((entry) => childIdMap.has(entry.childId))
      .map((entry) => ({
        child_id: childIdMap.get(entry.childId)!,
        amount_delta: entry.amountDelta,
        reason: entry.reason,
        category: entry.category ?? null,
        source: entry.source,
        created_at: entry.createdAt,
      }));

    if (entriesToInsert.length > 0) {
      const { error } = await supabase.from('ledger_entries').insert(entriesToInsert);
      if (error) throw error;
    }

    const summariesToInsert = localSummaries
      .filter((summary) => childIdMap.has(summary.childId))
      .map((summary) => ({
        child_id: childIdMap.get(summary.childId)!,
        started_at: summary.startedAt,
        ended_at: summary.endedAt,
        weekly_starting_amount: summary.weeklyStartingAmount,
        ending_balance: summary.endingBalance,
      }));

    if (summariesToInsert.length > 0) {
      const { error } = await supabase.from('week_summaries').insert(summariesToInsert);
      if (error) throw error;
    }

    await Promise.all([
      storageService.saveChildren([]),
      storageService.saveEntries([]),
      storageService.saveWeekSummaries([]),
      storageService.clearSelectedChildId(),
    ]);
  },
};

export const cloudAllowanceRepository = {
  async fetchHouseholdState(householdId: string): Promise<{
    children: Child[];
    entries: LedgerEntry[];
    summaries: WeekSummary[];
  }> {
    const supabase = getSupabase();

    const { data: childRows, error: childError } = await supabase
      .from('children')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true });

    if (childError) throw childError;
    const children = (childRows as ChildRow[]).map(mapChild);
    const childIds = children.map((child) => child.id);
    const memberNames = await profileService.getHouseholdMemberNames(householdId);

    if (childIds.length === 0) {
      return { children: [], entries: [], summaries: [] };
    }

    const [{ data: entryRows, error: entryError }, { data: summaryRows, error: summaryError }] =
      await Promise.all([
        supabase
          .from('ledger_entries')
          .select('*')
          .in('child_id', childIds)
          .order('created_at', { ascending: false }),
        supabase.from('week_summaries').select('*').in('child_id', childIds),
      ]);

    if (entryError) throw entryError;
    if (summaryError) throw summaryError;

    return {
      children,
      entries: (entryRows as LedgerEntryRow[]).map((row) => mapEntry(row, memberNames)),
      summaries: (summaryRows as WeekSummaryRow[]).map(mapSummary),
    };
  },

  subscribeToHousehold(
    householdId: string,
    onChange: () => void,
  ): () => void {
    const supabase = getSupabase();
    const channel = supabase
      .channel(`household:${householdId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'children', filter: `household_id=eq.${householdId}` },
        () => onChange(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ledger_entries' }, () =>
        onChange(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'week_summaries' }, () =>
        onChange(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  },

  async insertChild(
    householdId: string,
    name: string,
    weeklyStartingAmount: number,
  ): Promise<Child> {
    const { data, error } = await getSupabase()
      .from('children')
      .insert({
        household_id: householdId,
        name: name.trim(),
        weekly_starting_amount: weeklyStartingAmount,
      })
      .select('*')
      .single();

    if (error) throw error;
    return mapChild(data as ChildRow);
  },

  async updateChild(childId: string, name: string, weeklyStartingAmount: number): Promise<Child> {
    const { data, error } = await getSupabase()
      .from('children')
      .update({
        name: name.trim(),
        weekly_starting_amount: weeklyStartingAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', childId)
      .select('*')
      .single();

    if (error) throw error;
    return mapChild(data as ChildRow);
  },

  async deleteChild(childId: string): Promise<void> {
    const { error } = await getSupabase().from('children').delete().eq('id', childId);
    if (error) throw error;
  },

  async insertEntry(
    input: Omit<LedgerEntry, 'id' | 'createdAt'> & { createdAt?: string },
  ): Promise<LedgerEntry> {
    const { data: userData } = await getSupabase().auth.getUser();
    const { data, error } = await getSupabase()
      .from('ledger_entries')
      .insert({
        child_id: input.childId,
        amount_delta: input.amountDelta,
        reason: input.reason,
        category: input.category ?? null,
        source: input.source,
        created_by: userData.user?.id ?? null,
        ...(input.createdAt ? { created_at: input.createdAt } : {}),
      })
      .select('*')
      .single();

    if (error) throw error;
    const householdId = getActiveHouseholdId();
    const memberNames = householdId
      ? await profileService.getHouseholdMemberNames(householdId)
      : new Map();
    return mapEntry(data as LedgerEntryRow, memberNames);
  },

  async deleteEntry(entryId: string): Promise<void> {
    const { error } = await getSupabase().from('ledger_entries').delete().eq('id', entryId);
    if (error) throw error;
  },

  async insertWeekSummary(summary: Omit<WeekSummary, 'id'>): Promise<WeekSummary> {
    const { data, error } = await getSupabase()
      .from('week_summaries')
      .insert({
        child_id: summary.childId,
        started_at: summary.startedAt,
        ended_at: summary.endedAt,
        weekly_starting_amount: summary.weeklyStartingAmount,
        ending_balance: summary.endingBalance,
      })
      .select('*')
      .single();

    if (error) throw error;
    return mapSummary(data as WeekSummaryRow);
  },

  async updateChildWeekStartedAt(childId: string, weekStartedAt: string): Promise<Child> {
    const { data, error } = await getSupabase()
      .from('children')
      .update({ week_started_at: weekStartedAt, updated_at: new Date().toISOString() })
      .eq('id', childId)
      .select('*')
      .single();

    if (error) throw error;
    return mapChild(data as ChildRow);
  },
};
