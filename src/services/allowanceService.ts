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
import { syncChildrenToAppGroup } from './siriEntryService';
import { storageService } from './storageService';

async function ensureSeedData(): Promise<{ children: Child[]; selectedChildId: string | null }> {
  let children = await storageService.getChildren();
  let selectedChildId = await storageService.getSelectedChildId();

  if (children.length === 0) {
    children = [createChild('Daniel'), createChild('Emma')];
    await storageService.saveChildren(children);
  }

  if (!selectedChildId || !children.some((child) => child.id === selectedChildId)) {
    selectedChildId = children[0]?.id ?? null;
    if (selectedChildId) {
      await storageService.setSelectedChildId(selectedChildId);
    }
  }

  syncChildrenToAppGroup(children);

  return { children, selectedChildId };
}

export const allowanceService = {
  async loadAppState(): Promise<{
    children: Child[];
    entries: LedgerEntry[];
    selectedChildId: string | null;
  }> {
    const [{ children, selectedChildId }, entries] = await Promise.all([
      ensureSeedData(),
      storageService.getEntries(),
    ]);
    return { children, entries, selectedChildId };
  },

  async selectChild(childId: string): Promise<void> {
    await storageService.setSelectedChildId(childId);
  },

  async addChild(name: string, weeklyStartingAmount = DEFAULT_WEEKLY_STARTING_AMOUNT): Promise<Child> {
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
    const entries = await storageService.getEntries();
    const entry = createLedgerEntry(input);
    await storageService.saveEntries([entry, ...entries]);
    return entry;
  },

  async getCurrentWeekEntriesForChild(child: Child): Promise<LedgerEntry[]> {
    const entries = await storageService.getEntries();
    return getCurrentWeekEntries(
      entries.filter((entry) => entry.childId === child.id),
      child.weekStartedAt,
    );
  },

  async closeWeek(childId: string): Promise<Child> {
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

    return {
      week,
      entries: getEntriesForWeek(entries, childId, week),
    };
  },

  async removeChild(childId: string): Promise<{
    children: Child[];
    entries: LedgerEntry[];
    selectedChildId: string | null;
  }> {
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
