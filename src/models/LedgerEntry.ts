export type LedgerEntrySource = 'manual' | 'siri' | 'ai';

export interface LedgerEntry {
  id: string;
  childId: string;
  amountDelta: number;
  reason: string;
  category?: string;
  createdAt: string;
  source: LedgerEntrySource;
  loggedByUserId?: string;
  loggedByName?: string;
}

export interface CreateLedgerEntryInput {
  childId: string;
  amountDelta: number;
  reason: string;
  category?: string;
  source?: LedgerEntrySource;
}

import { generateId } from '../utils/generateId';

export function createLedgerEntry(input: CreateLedgerEntryInput): LedgerEntry {
  return {
    id: generateId(),
    childId: input.childId,
    amountDelta: input.amountDelta,
    reason: input.reason,
    category: input.category,
    createdAt: new Date().toISOString(),
    source: input.source ?? 'manual',
  };
}
