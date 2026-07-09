import {
  getSiriAuthorizationStatus,
  isAllowanceIntentsAvailable,
  openAppSettings,
  requestSiriAuthorization,
  SiriAuthorizationStatus,
} from 'allowance-intents';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { SiriSetupModal, SiriSetupMode } from '../components/SiriSetupModal';
import { storageService } from '../services/storageService';

interface SiriSetupContextValue {
  isAvailable: boolean;
  show: () => Promise<void>;
  dismiss: () => void;
  dismissPermanently: () => Promise<void>;
}

const SiriSetupContext = createContext<SiriSetupContextValue | null>(null);

export function SiriSetupProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<SiriSetupMode>('brief');
  const [status, setStatus] = useState<SiriAuthorizationStatus>('notDetermined');
  const isAvailable = isAllowanceIntentsAvailable();

  const show = useCallback(async () => {
    if (!isAvailable) return;
    const authStatus = await getSiriAuthorizationStatus();
    setMode('guide');
    setStatus(authStatus ?? 'notDetermined');
    setVisible(true);
  }, [isAvailable]);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const dismissPermanently = useCallback(async () => {
    await storageService.setSiriSetupPromptDismissed(true);
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!isAvailable) return;

    let active = true;
    void (async () => {
      const [dismissed, usedSiri] = await Promise.all([
        storageService.getSiriSetupPromptDismissed(),
        storageService.getHasLoggedViaSiri(),
      ]);
      if (!active || dismissed || usedSiri) return;

      const authStatus = await getSiriAuthorizationStatus();
      if (!active || !authStatus) return;

      setMode('brief');
      setStatus(authStatus);
      setVisible(true);
    })();

    return () => {
      active = false;
    };
  }, [isAvailable]);

  const value = useMemo(
    () => ({
      isAvailable,
      show,
      dismiss,
      dismissPermanently,
    }),
    [isAvailable, show, dismiss, dismissPermanently],
  );

  return (
    <SiriSetupContext.Provider value={value}>
      {children}
      <SiriSetupModal
        visible={visible}
        mode={mode}
        status={status}
        onDismiss={dismiss}
        onDismissPermanently={dismissPermanently}
        onEnableSiri={async () => {
          const nextStatus = await requestSiriAuthorization();
          if (!nextStatus) return;
          setStatus(nextStatus);
          if (nextStatus === 'denied' || nextStatus === 'restricted') {
            openAppSettings();
          }
        }}
        onOpenSettings={openAppSettings}
      />
    </SiriSetupContext.Provider>
  );
}

export function useSiriSetup(): SiriSetupContextValue {
  const context = useContext(SiriSetupContext);
  if (!context) {
    throw new Error('useSiriSetup must be used within SiriSetupProvider');
  }
  return context;
}
