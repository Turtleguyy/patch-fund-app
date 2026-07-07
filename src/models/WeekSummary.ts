import { generateId } from '../utils/generateId';

export interface WeekSummary {
  id: string;
  childId: string;
  startedAt: string;
  endedAt: string;
  weeklyStartingAmount: number;
  endingBalance: number;
}

export interface CreateWeekSummaryInput {
  childId: string;
  startedAt: string;
  endedAt: string;
  weeklyStartingAmount: number;
  endingBalance: number;
}

export function createWeekSummary(input: CreateWeekSummaryInput): WeekSummary {
  return {
    id: generateId(),
    ...input,
  };
}

export interface WeekHistoryItem {
  id: string;
  childId: string;
  startedAt: string;
  endedAt: string;
  weeklyStartingAmount: number;
  endingBalance: number;
  source: 'saved' | 'inferred';
}
