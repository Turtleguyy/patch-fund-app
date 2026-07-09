import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export const APP_GROUP_KEYS = {
  pendingSiriText: 'pending_siri_text',
  childrenJson: 'children_json',
  selectedChildId: 'selected_child_id',
} as const;

export type SiriAuthorizationStatus = 'authorized' | 'denied' | 'restricted' | 'notDetermined';

type AllowanceIntentsNativeModule = {
  getSharedString(key: string): string | null;
  setSharedString(key: string, value: string | null): void;
  syncChildrenJson(json: string): void;
  getSiriAuthorizationStatus(): Promise<SiriAuthorizationStatus>;
  requestSiriAuthorization(): Promise<SiriAuthorizationStatus>;
  openAppSettings(): void;
};

let nativeModule: AllowanceIntentsNativeModule | null | undefined;

function getNativeModule(): AllowanceIntentsNativeModule | null {
  if (nativeModule !== undefined) {
    return nativeModule;
  }

  if (Platform.OS !== 'ios') {
    nativeModule = null;
    return nativeModule;
  }

  try {
    nativeModule = requireNativeModule<AllowanceIntentsNativeModule>('AllowanceIntents');
  } catch {
    nativeModule = null;
  }

  return nativeModule;
}

export function getSharedString(key: string): string | null {
  return getNativeModule()?.getSharedString(key) ?? null;
}

export function setSharedString(key: string, value: string | null): void {
  getNativeModule()?.setSharedString(key, value);
}

export function syncChildrenJson(json: string): void {
  getNativeModule()?.syncChildrenJson(json);
}

export function isAllowanceIntentsAvailable(): boolean {
  return getNativeModule() != null;
}

export async function getSiriAuthorizationStatus(): Promise<SiriAuthorizationStatus | null> {
  return (await getNativeModule()?.getSiriAuthorizationStatus()) ?? null;
}

export async function requestSiriAuthorization(): Promise<SiriAuthorizationStatus | null> {
  return (await getNativeModule()?.requestSiriAuthorization()) ?? null;
}

export function openAppSettings(): void {
  getNativeModule()?.openAppSettings();
}
