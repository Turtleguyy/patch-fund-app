import { APP_GROUP_KEYS, getSharedString, setSharedString } from 'allowance-intents';
import { Child } from '../models/Child';
import { ParsedAllowanceEntry } from '../models/ParsedAllowanceEntry';
import { parseAllowanceEntryWithAI } from './aiParserService';
import { allowanceService } from './allowanceService';

export interface PendingSiriEntry {
  spokenText: string;
  parsed: ParsedAllowanceEntry;
  childId: string;
  childName: string;
}

export function syncChildrenToAppGroup(children: Child[]): void {
  const payload = children.map((child) => ({ id: child.id, name: child.name }));
  setSharedString(APP_GROUP_KEYS.childrenJson, JSON.stringify(payload));
}

export function resolveChildId(
  parsed: ParsedAllowanceEntry,
  children: Child[],
  selectedChildId: string | null,
): { childId: string; childName: string } | null {
  if (parsed.childName) {
    const match = children.find(
      (child) => child.name.toLowerCase() === parsed.childName!.toLowerCase(),
    );
    if (match) {
      return { childId: match.id, childName: match.name };
    }
  }

  const selected = children.find((child) => child.id === selectedChildId);
  if (selected) {
    return { childId: selected.id, childName: selected.name };
  }

  if (children.length === 1) {
    return { childId: children[0].id, childName: children[0].name };
  }

  return null;
}

export async function consumePendingSiriEntry(): Promise<PendingSiriEntry | null> {
  const spokenText = getSharedString(APP_GROUP_KEYS.pendingSiriText)?.trim();
  if (!spokenText) return null;

  setSharedString(APP_GROUP_KEYS.pendingSiriText, null);

  const { children, selectedChildId } = await allowanceService.loadAppState();
  syncChildrenToAppGroup(children);

  const parsed = await parseAllowanceEntryWithAI(
    spokenText,
    children.map((child) => child.name),
  );

  const resolved = resolveChildId(parsed, children, selectedChildId);
  if (!resolved) {
    return null;
  }

  return {
    spokenText,
    parsed,
    childId: resolved.childId,
    childName: resolved.childName,
  };
}

export async function commitSiriEntry(
  pending: PendingSiriEntry,
  overrides?: Partial<Pick<ParsedAllowanceEntry, 'amountDelta' | 'reason' | 'category'>>,
): Promise<void> {
  await allowanceService.addEntry({
    childId: pending.childId,
    amountDelta: overrides?.amountDelta ?? pending.parsed.amountDelta,
    reason: overrides?.reason ?? pending.parsed.reason,
    category: overrides?.category ?? pending.parsed.category,
    source: 'siri',
  });
}
