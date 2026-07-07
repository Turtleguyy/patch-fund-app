import { cloudAllowanceRepository } from './householdService';

type SyncListener = () => void;

let activeHouseholdId: string | null = null;
let unsubscribeChannel: (() => void) | null = null;
const listeners = new Set<SyncListener>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

export const cloudSyncService = {
  setHousehold(householdId: string | null): void {
    if (householdId === activeHouseholdId) return;

    unsubscribeChannel?.();
    unsubscribeChannel = null;
    activeHouseholdId = householdId;

    if (householdId) {
      unsubscribeChannel = cloudAllowanceRepository.subscribeToHousehold(
        householdId,
        notifyListeners,
      );
    }
  },

  addListener(listener: SyncListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  clear(): void {
    unsubscribeChannel?.();
    unsubscribeChannel = null;
    activeHouseholdId = null;
    listeners.clear();
  },
};
