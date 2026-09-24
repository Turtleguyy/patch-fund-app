import { LedgerEntry } from '../models/LedgerEntry';
import { WeekHistoryItem, WeekSummary } from '../models/WeekSummary';
import { formatMoney } from './formatMoney';
import { formatSuggestionAmount } from './entrySuggestions';

export function getCurrentWeekEntries<T extends { createdAt: string }>(
  entries: T[],
  weekStartedAt: string,
): T[] {
  const weekStart = new Date(weekStartedAt).getTime();
  return entries
    .filter((entry) => new Date(entry.createdAt).getTime() >= weekStart)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function calculateWeeklyBalance(
  weeklyStartingAmount: number,
  entries: { amountDelta: number }[],
): number {
  const deltaSum = entries.reduce((sum, entry) => sum + entry.amountDelta, 0);
  return weeklyStartingAmount + deltaSum;
}

/** Plain-text week wrap-up for Messages / share sheet. */
export function formatWeekCloseShareMessage(input: {
  childName: string;
  startedAt: string;
  endedAt: string;
  weeklyStartingAmount: number;
  endingBalance: number;
  entries: Pick<LedgerEntry, 'amountDelta' | 'reason' | 'createdAt'>[];
}): string {
  const { childName, startedAt, endedAt, weeklyStartingAmount, endingBalance, entries } = input;
  const lines = [
    `${childName}'s week · ${formatWeekRange(startedAt, endedAt)}`,
    `Final: ${formatMoney(endingBalance)} (started at ${formatMoney(weeklyStartingAmount)})`,
  ];

  if (entries.length > 0) {
    lines.push('');
    const chronological = [...entries].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    for (const entry of chronological) {
      lines.push(`${formatSuggestionAmount(entry.amountDelta)} · ${entry.reason.trim()}`);
    }
  } else {
    lines.push('', 'No additions or takes this week.');
  }

  lines.push('', '— Patch Fund');
  return lines.join('\n');
}

function getMondayWeekStart(date: Date): Date {
  const monday = new Date(date);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function entryTimestamp(entry: { createdAt: string }): number {
  return new Date(entry.createdAt).getTime();
}

function isEntryInWeek(
  entry: { createdAt: string },
  week: { startedAt: string; endedAt: string },
): boolean {
  const timestamp = entryTimestamp(entry);
  return timestamp >= new Date(week.startedAt).getTime() && timestamp < new Date(week.endedAt).getTime();
}

export function getEntriesForWeek(
  entries: LedgerEntry[],
  childId: string,
  week: Pick<WeekHistoryItem, 'startedAt' | 'endedAt'>,
): LedgerEntry[] {
  return entries
    .filter((entry) => entry.childId === childId && isEntryInWeek(entry, week))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function formatWeekRange(startedAt: string, endedAt: string): string {
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const endDisplay = new Date(Math.max(start.getTime(), end.getTime() - 1));

  if (start.toDateString() === endDisplay.toDateString()) {
    return start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const sameMonth =
    start.getMonth() === endDisplay.getMonth() && start.getFullYear() === endDisplay.getFullYear();
  const sameYear = start.getFullYear() === endDisplay.getFullYear();

  const startLabel = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  const endLabel = endDisplay.toLocaleDateString(undefined, {
    month: sameMonth ? undefined : 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${startLabel} – ${endLabel}`;
}

function buildInferredWeeks(
  childId: string,
  orphanEntries: LedgerEntry[],
  weeklyStartingAmount: number,
): WeekHistoryItem[] {
  const groups = new Map<string, LedgerEntry[]>();

  for (const entry of orphanEntries) {
    const weekStart = getMondayWeekStart(new Date(entry.createdAt));
    const key = weekStart.toISOString();
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }

  return [...groups.entries()]
    .map(([weekStartIso, weekEntries]) => {
      const startedAt = weekStartIso;
      const endedAt = new Date(new Date(weekStartIso).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      return {
        id: `inferred:${weekStartIso}`,
        childId,
        startedAt,
        endedAt,
        weeklyStartingAmount,
        endingBalance: calculateWeeklyBalance(weeklyStartingAmount, weekEntries),
        source: 'inferred' as const,
      };
    })
    .sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime());
}

export function buildWeekHistory(
  childId: string,
  weekStartedAt: string,
  weeklyStartingAmount: number,
  entries: LedgerEntry[],
  savedSummaries: WeekSummary[],
): WeekHistoryItem[] {
  const childSummaries = savedSummaries
    .filter((summary) => summary.childId === childId)
    .map(
      (summary): WeekHistoryItem => ({
        id: summary.id,
        childId: summary.childId,
        startedAt: summary.startedAt,
        endedAt: summary.endedAt,
        weeklyStartingAmount: summary.weeklyStartingAmount,
        endingBalance: summary.endingBalance,
        source: 'saved',
      }),
    );

  const currentWeekStart = new Date(weekStartedAt).getTime();
  const orphanEntries = entries.filter((entry) => {
    if (entry.childId !== childId) return false;
    if (entryTimestamp(entry) >= currentWeekStart) return false;
    return !childSummaries.some((week) => isEntryInWeek(entry, week));
  });

  const inferredWeeks = buildInferredWeeks(childId, orphanEntries, weeklyStartingAmount);

  return [...childSummaries, ...inferredWeeks].sort(
    (a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime(),
  );
}

export function findWeekHistoryItem(
  childId: string,
  weekId: string,
  weekStartedAt: string,
  weeklyStartingAmount: number,
  entries: LedgerEntry[],
  savedSummaries: WeekSummary[],
): WeekHistoryItem | null {
  const history = buildWeekHistory(
    childId,
    weekStartedAt,
    weeklyStartingAmount,
    entries,
    savedSummaries,
  );
  return history.find((week) => week.id === weekId) ?? null;
}
