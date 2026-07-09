import { isSupabaseConfigured } from '../lib/supabase';
import { Child, createChild, DEFAULT_WEEKLY_STARTING_AMOUNT } from '../models/Child';
import { createLedgerEntry, CreateLedgerEntryInput, LedgerEntry } from '../models/LedgerEntry';
import { createWeekSummary, WeekHistoryItem } from '../models/WeekSummary';
import {
  buildWeekHistory,
  calculateWeeklyBalance,
  findWeekHistoryItem,
  getCurrentWeekEntries,
  getEntriesForWeek,
} from '../utils/weekUtils';
import {
  cloudAllowanceRepository,
  getActiveHouseholdId,
} from './householdService';
import { syncChildrenToAppGroup } from './siriEntryService';
import { storageService } from './storageService';

function isCloudMode(): boolean {
  return isSupabaseConfigured() && getActiveHouseholdId() !== null;
}

async function ensureLocalSeedData(): Promise<{ children: Child[]; selectedChildId: string | null }> {
  const children = await storageService.getChildren();
  let selectedChildId = await storageService.getSelectedChildId();

  if (!selectedChildId || !children.some((child) => child.id === selectedChildId)) {
    selectedChildId = children[0]?.id ?? null;
    if (selectedChildId) {
      await storageService.setSelectedChildId(selectedChildId);
    } else {
      await storageService.clearSelectedChildId();
    }
  }

  syncChildrenToAppGroup(children);
  return { children, selectedChildId };
}

async function loadCloudState(): Promise<{
  children: Child[];
  entries: LedgerEntry[];
  selectedChildId: string | null;
  summaries: Awaited<ReturnType<typeof storageService.getWeekSummaries>>;
}> {
  const householdId = getActiveHouseholdId();
  if (!householdId) {
    return { children: [], entries: [], selectedChildId: null, summaries: [] };
  }

  const { children, entries, summaries } =
    await cloudAllowanceRepository.fetchHouseholdState(householdId);

  let selectedChildId = await storageService.getSelectedChildId();
  if (!selectedChildId || !children.some((child) => child.id === selectedChildId)) {
    selectedChildId = children[0]?.id ?? null;
    if (selectedChildId) {
      await storageService.setSelectedChildId(selectedChildId);
    } else {
      await storageService.clearSelectedChildId();
    }
  }

  syncChildrenToAppGroup(children);
  return { children, entries, selectedChildId, summaries };
}

export const allowanceService = {
  isCloudMode,

  async loadAppState(): Promise<{
    children: Child[];
    entries: LedgerEntry[];
    selectedChildId: string | null;
  }> {
    if (isCloudMode()) {
      const { children, entries, selectedChildId } = await loadCloudState();
      return { children, entries, selectedChildId };
    }

    const [{ children, selectedChildId }, entries] = await Promise.all([
      ensureLocalSeedData(),
      storageService.getEntries(),
    ]);
    return { children, entries, selectedChildId };
  },

  async selectChild(childId: string): Promise<void> {
    await storageService.setSelectedChildId(childId);
    if (isCloudMode()) {
      const householdId = getActiveHouseholdId()!;
      const { children } = await cloudAllowanceRepository.fetchHouseholdState(householdId);
      syncChildrenToAppGroup(children, childId);
      return;
    }

    const children = await storageService.getChildren();
    syncChildrenToAppGroup(children, childId);
  },

  async addChild(name: string, weeklyStartingAmount = DEFAULT_WEEKLY_STARTING_AMOUNT): Promise<Child> {
    if (isCloudMode()) {
      const householdId = getActiveHouseholdId()!;
      const child = await cloudAllowanceRepository.insertChild(
        householdId,
        name.trim(),
        weeklyStartingAmount,
      );
      await storageService.setSelectedChildId(child.id);
      const { children } = await cloudAllowanceRepository.fetchHouseholdState(householdId);
      syncChildrenToAppGroup(children);
      return child;
    }

    const children = await storageService.getChildren();
    const child = createChild(name.trim(), weeklyStartingAmount);
    const updated = [...children, child];
    await storageService.saveChildren(updated);
    await storageService.setSelectedChildId(child.id);
    syncChildrenToAppGroup(updated);
    return child;
  },

  async updateChild(
    childId: string,
    name: string,
    weeklyStartingAmount: number,
  ): Promise<Child> {
    if (isCloudMode()) {
      const child = await cloudAllowanceRepository.updateChild(
        childId,
        name.trim(),
        weeklyStartingAmount,
      );
      const householdId = getActiveHouseholdId()!;
      const { children } = await cloudAllowanceRepository.fetchHouseholdState(householdId);
      syncChildrenToAppGroup(children);
      return child;
    }

    const children = await storageService.getChildren();
    const updated = children.map((child) =>
      child.id === childId ? { ...child, name: name.trim(), weeklyStartingAmount } : child,
    );
    await storageService.saveChildren(updated);
    const child = updated.find((item) => item.id === childId);
    if (!child) throw new Error('Child not found');
    syncChildrenToAppGroup(updated);
    return child;
  },

  async addEntry(input: CreateLedgerEntryInput): Promise<LedgerEntry> {
    if (isCloudMode()) {
      return cloudAllowanceRepository.insertEntry({
        childId: input.childId,
        amountDelta: input.amountDelta,
        reason: input.reason,
        category: input.category,
        source: input.source ?? 'manual',
      });
    }

    const entries = await storageService.getEntries();
    const entry = createLedgerEntry(input);
    await storageService.saveEntries([entry, ...entries]);
    return entry;
  },

  async updateEntry(
    entryId: string,
    updates: Pick<LedgerEntry, 'amountDelta' | 'reason'>,
  ): Promise<LedgerEntry> {
    if (isCloudMode()) {
      return cloudAllowanceRepository.updateEntry(entryId, updates);
    }

    const entries = await storageService.getEntries();
    const index = entries.findIndex((entry) => entry.id === entryId);
    if (index === -1) {
      throw new Error('Entry not found');
    }

    const updated: LedgerEntry = {
      ...entries[index],
      amountDelta: updates.amountDelta,
      reason: updates.reason,
    };
    const nextEntries = [...entries];
    nextEntries[index] = updated;
    await storageService.saveEntries(nextEntries);
    return updated;
  },

  async deleteEntry(entryId: string): Promise<void> {
    if (isCloudMode()) {
      await cloudAllowanceRepository.deleteEntry(entryId);
      return;
    }

    const entries = await storageService.getEntries();
    const updated = entries.filter((entry) => entry.id !== entryId);
    if (updated.length === entries.length) {
      throw new Error('Entry not found');
    }
    await storageService.saveEntries(updated);
  },

  async getCurrentWeekEntriesForChild(child: Child): Promise<LedgerEntry[]> {
    if (isCloudMode()) {
      const householdId = getActiveHouseholdId()!;
      const { entries } = await cloudAllowanceRepository.fetchHouseholdState(householdId);
      return getCurrentWeekEntries(
        entries.filter((entry) => entry.childId === child.id),
        child.weekStartedAt,
      );
    }

    const entries = await storageService.getEntries();
    return getCurrentWeekEntries(
      entries.filter((entry) => entry.childId === child.id),
      child.weekStartedAt,
    );
  },

  async closeWeek(childId: string): Promise<Child> {
    if (isCloudMode()) {
      const householdId = getActiveHouseholdId()!;
      const { children, entries } = await cloudAllowanceRepository.fetchHouseholdState(householdId);
      const child = children.find((item) => item.id === childId);
      if (!child) throw new Error('Child not found');

      const weekEntries = getCurrentWeekEntries(
        entries.filter((entry) => entry.childId === childId),
        child.weekStartedAt,
      );
      const endedAt = new Date().toISOString();

      await cloudAllowanceRepository.insertWeekSummary({
        childId,
        startedAt: child.weekStartedAt,
        endedAt,
        weeklyStartingAmount: child.weeklyStartingAmount,
        endingBalance: calculateWeeklyBalance(child.weeklyStartingAmount, weekEntries),
      });

      return cloudAllowanceRepository.updateChildWeekStartedAt(childId, endedAt);
    }

    const children = await storageService.getChildren();
    const child = children.find((item) => item.id === childId);
    if (!child) throw new Error('Child not found');

    const entries = await storageService.getEntries();
    const weekEntries = getCurrentWeekEntries(
      entries.filter((entry) => entry.childId === childId),
      child.weekStartedAt,
    );
    const endedAt = new Date().toISOString();
    const summary = createWeekSummary({
      childId,
      startedAt: child.weekStartedAt,
      endedAt,
      weeklyStartingAmount: child.weeklyStartingAmount,
      endingBalance: calculateWeeklyBalance(child.weeklyStartingAmount, weekEntries),
    });

    const summaries = await storageService.getWeekSummaries();
    await storageService.saveWeekSummaries([summary, ...summaries]);

    const updated = children.map((item) =>
      item.id === childId ? { ...item, weekStartedAt: endedAt } : item,
    );
    await storageService.saveChildren(updated);
    const updatedChild = updated.find((item) => item.id === childId);
    if (!updatedChild) throw new Error('Child not found');
    return updatedChild;
  },

  async getWeekHistory(childId: string): Promise<WeekHistoryItem[]> {
    if (isCloudMode()) {
      const householdId = getActiveHouseholdId()!;
      const { children, entries, summaries } =
        await cloudAllowanceRepository.fetchHouseholdState(householdId);
      const child = children.find((item) => item.id === childId);
      if (!child) throw new Error('Child not found');

      return buildWeekHistory(
        child.id,
        child.weekStartedAt,
        child.weeklyStartingAmount,
        entries,
        summaries,
      );
    }

    const [children, entries, summaries] = await Promise.all([
      storageService.getChildren(),
      storageService.getEntries(),
      storageService.getWeekSummaries(),
    ]);
    const child = children.find((item) => item.id === childId);
    if (!child) throw new Error('Child not found');

    return buildWeekHistory(
      child.id,
      child.weekStartedAt,
      child.weeklyStartingAmount,
      entries,
      summaries,
    );
  },

  async getWeekHistoryDetail(
    childId: string,
    weekId: string,
  ): Promise<{ week: WeekHistoryItem; entries: LedgerEntry[] }> {
    if (isCloudMode()) {
      const householdId = getActiveHouseholdId()!;
      const { children, entries, summaries } =
        await cloudAllowanceRepository.fetchHouseholdState(householdId);
      const child = children.find((item) => item.id === childId);
      if (!child) throw new Error('Child not found');

      const week = findWeekHistoryItem(
        child.id,
        weekId,
        child.weekStartedAt,
        child.weeklyStartingAmount,
        entries,
        summaries,
      );
      if (!week) throw new Error('Week not found');

      return { week, entries: getEntriesForWeek(entries, childId, week) };
    }

    const [children, entries, summaries] = await Promise.all([
      storageService.getChildren(),
      storageService.getEntries(),
      storageService.getWeekSummaries(),
    ]);
    const child = children.find((item) => item.id === childId);
    if (!child) throw new Error('Child not found');

    const week = findWeekHistoryItem(
      child.id,
      weekId,
      child.weekStartedAt,
      child.weeklyStartingAmount,
      entries,
      summaries,
    );
    if (!week) throw new Error('Week not found');

    return { week, entries: getEntriesForWeek(entries, childId, week) };
  },

  async removeChild(childId: string): Promise<{
    children: Child[];
    entries: LedgerEntry[];
    selectedChildId: string | null;
  }> {
    if (isCloudMode()) {
      const householdId = getActiveHouseholdId()!;
      await cloudAllowanceRepository.deleteChild(childId);

      const currentSelectedChildId = await storageService.getSelectedChildId();
      const { children, entries } = await cloudAllowanceRepository.fetchHouseholdState(householdId);

      let selectedChildId = currentSelectedChildId;
      if (currentSelectedChildId === childId) {
        selectedChildId = children[0]?.id ?? null;
        if (selectedChildId) {
          await storageService.setSelectedChildId(selectedChildId);
        } else {
          await storageService.clearSelectedChildId();
        }
      }

      syncChildrenToAppGroup(children);
      return { children, entries, selectedChildId };
    }

    const [children, entries, currentSelectedChildId, summaries] = await Promise.all([
      storageService.getChildren(),
      storageService.getEntries(),
      storageService.getSelectedChildId(),
      storageService.getWeekSummaries(),
    ]);

    const updatedChildren = children.filter((child) => child.id !== childId);
    if (updatedChildren.length === children.length) {
      throw new Error('Child not found');
    }

    const updatedEntries = entries.filter((entry) => entry.childId !== childId);
    const updatedSummaries = summaries.filter((summary) => summary.childId !== childId);
    await storageService.saveChildren(updatedChildren);
    await storageService.saveEntries(updatedEntries);
    await storageService.saveWeekSummaries(updatedSummaries);

    let selectedChildId = currentSelectedChildId;
    if (currentSelectedChildId === childId) {
      selectedChildId = updatedChildren[0]?.id ?? null;
      if (selectedChildId) {
        await storageService.setSelectedChildId(selectedChildId);
      } else {
        await storageService.clearSelectedChildId();
      }
    }

    syncChildrenToAppGroup(updatedChildren);
    return { children: updatedChildren, entries: updatedEntries, selectedChildId };
  },
};
