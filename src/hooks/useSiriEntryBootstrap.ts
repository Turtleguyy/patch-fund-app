import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { consumePendingSiriEntry, PendingSiriEntry } from '../services/siriEntryService';

async function routePendingSiriEntry(
  navigationRef: NavigationContainerRef<RootStackParamList>,
): Promise<void> {
  if (!navigationRef.isReady()) return;

  const pending = await consumePendingSiriEntry();
  if (!pending) return;

  if (pending.parsed.needsConfirmation) {
    navigationRef.navigate('SiriConfirm', { pending });
    return;
  }

  const { commitSiriEntry } = await import('../services/siriEntryService');
  await commitSiriEntry(pending);
  navigationRef.navigate('MainTabs', { screen: 'HomeTab', params: { screen: 'Home' } });
}

export function useSiriEntryBootstrap(
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>,
) {
  const handlingRef = useRef(false);

  useEffect(() => {
    const handlePending = async () => {
      if (!navigationRef.current || handlingRef.current) return;
      handlingRef.current = true;
      try {
        await routePendingSiriEntry(navigationRef.current);
      } finally {
        handlingRef.current = false;
      }
    };

    void handlePending();

    const onAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void handlePending();
      }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, [navigationRef]);
}

export type { PendingSiriEntry };
