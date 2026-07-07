export interface ProfileRow {
  id: string;
  display_name: string | null;
  created_at: string;
}

export interface HouseholdRow {
  id: string;
  name: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface ChildRow {
  id: string;
  household_id: string;
  name: string;
  weekly_starting_amount: number;
  week_started_at: string;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntryRow {
  id: string;
  child_id: string;
  amount_delta: number;
  reason: string;
  category: string | null;
  source: 'manual' | 'siri' | 'ai';
  created_at: string;
  created_by: string | null;
}

export interface WeekSummaryRow {
  id: string;
  child_id: string;
  started_at: string;
  ended_at: string;
  weekly_starting_amount: number;
  ending_balance: number;
  created_at: string;
}
