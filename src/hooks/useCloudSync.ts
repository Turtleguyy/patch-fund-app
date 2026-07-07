import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { cloudSyncService } from '../services/cloudSyncService';

/** Refetch allowance data when another household member changes cloud records. */
export function useCloudSync(onSync: () => void): void {
  const { household, isCloudEnabled, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isCloudEnabled || !isSignedIn || !household) return;

    cloudSyncService.setHousehold(household.id);
    return cloudSyncService.addListener(onSync);
  }, [household, isCloudEnabled, isSignedIn, onSync]);
}
