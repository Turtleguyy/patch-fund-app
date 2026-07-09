import AsyncStorage from '@react-native-async-storage/async-storage';
import { Child } from '../models/Child';
import { LedgerEntry } from '../models/LedgerEntry';
import { WeekSummary } from '../models/WeekSummary';

const KEYS = {
  children: '@allowance/children',
  entries: '@allowance/entries',
  selectedChildId: '@allowance/selectedChildId',
  lastLogDirection: '@allowance/lastLogDirection',
  siriSetupPromptDismissed: '@allowance/siriSetupPromptDismissed',
  hasLoggedViaSiri: '@allowance/hasLoggedViaSiri',
  weekSummaries: '@allowance/weekSummaries',
} as const;

export type LogDirection = 'add' | 'take';

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storageService = {
  async getChildren(): Promise<Child[]> {
    return readJson<Child[]>(KEYS.children, []);
  },

  async saveChildren(children: Child[]): Promise<void> {
    await writeJson(KEYS.children, children);
  },

  async getEntries(): Promise<LedgerEntry[]> {
    return readJson<LedgerEntry[]>(KEYS.entries, []);
  },

  async saveEntries(entries: LedgerEntry[]): Promise<void> {
    await writeJson(KEYS.entries, entries);
  },

  async getSelectedChildId(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.selectedChildId);
  },

  async setSelectedChildId(childId: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.selectedChildId, childId);
  },

  async clearSelectedChildId(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.selectedChildId);
  },

  async getLastLogDirection(): Promise<LogDirection> {
    const value = await AsyncStorage.getItem(KEYS.lastLogDirection);
    return value === 'take' ? 'take' : 'add';
  },

  async setLastLogDirection(direction: LogDirection): Promise<void> {
    await AsyncStorage.setItem(KEYS.lastLogDirection, direction);
  },

  async getSiriSetupPromptDismissed(): Promise<boolean> {
    return (await AsyncStorage.getItem(KEYS.siriSetupPromptDismissed)) === 'true';
  },

  async setSiriSetupPromptDismissed(dismissed: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.siriSetupPromptDismissed, dismissed ? 'true' : 'false');
  },

  async getHasLoggedViaSiri(): Promise<boolean> {
    return (await AsyncStorage.getItem(KEYS.hasLoggedViaSiri)) === 'true';
  },

  async setHasLoggedViaSiri(logged: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.hasLoggedViaSiri, logged ? 'true' : 'false');
  },

  async getWeekSummaries(): Promise<WeekSummary[]> {
    return readJson<WeekSummary[]>(KEYS.weekSummaries, []);
  },

  async saveWeekSummaries(summaries: WeekSummary[]): Promise<void> {
    await writeJson(KEYS.weekSummaries, summaries);
  },
};
