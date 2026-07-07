export interface Child {
  id: string;
  name: string;
  weeklyStartingAmount: number;
  /** Entries with createdAt >= weekStartedAt belong to the current week. */
  weekStartedAt: string;
}

export const DEFAULT_WEEKLY_STARTING_AMOUNT = 10;

import { generateId } from '../utils/generateId';

export function createChild(name: string, weeklyStartingAmount = DEFAULT_WEEKLY_STARTING_AMOUNT): Child {
  return {
    id: generateId(),
    name,
    weeklyStartingAmount,
    weekStartedAt: new Date().toISOString(),
  };
}
