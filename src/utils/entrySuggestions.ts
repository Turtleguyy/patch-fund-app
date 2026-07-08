import { LedgerEntry } from '../models/LedgerEntry';
import { formatMoney } from './formatMoney';

export interface EntrySuggestion {
  amountDelta: number;
  reason: string;
  count: number;
}

function suggestionKey(amountDelta: number, reason: string): string {
  return `${amountDelta}|${reason.trim().toLowerCase()}`;
}

export function getTopEntrySuggestions(
  entries: LedgerEntry[],
  childId: string,
  limit = 3,
): EntrySuggestion[] {
  const counts = new Map<string, EntrySuggestion>();

  for (const entry of entries) {
    if (entry.childId !== childId) continue;
    const reason = entry.reason.trim();
    if (!reason) continue;

    const key = suggestionKey(entry.amountDelta, reason);
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, {
        amountDelta: entry.amountDelta,
        reason,
        count: 1,
      });
    }
  }

  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export function formatSuggestionAmount(amountDelta: number): string {
  if (amountDelta > 0) return `+${formatMoney(amountDelta)}`;
  return formatMoney(amountDelta);
}

export function formatSuggestionLabel(suggestion: EntrySuggestion): string {
  return `${formatSuggestionAmount(suggestion.amountDelta)} · ${suggestion.reason}`;
}
