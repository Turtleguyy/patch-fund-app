import Constants from 'expo-constants';
import { APP_IDENTITY } from './appIdentity.js';

type AppExtra = {
  openAiApiKey?: string;
  appGroup?: string;
  scheme?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

export const env = {
  openAiApiKey: extra.openAiApiKey?.trim() ?? '',
  appGroup: extra.appGroup ?? APP_IDENTITY.appGroup,
  scheme: extra.scheme ?? APP_IDENTITY.scheme,
  supabaseUrl: extra.supabaseUrl?.trim() ?? '',
  supabaseAnonKey: extra.supabaseAnonKey?.trim() ?? '',
  hasOpenAiApiKey: Boolean(extra.openAiApiKey?.trim()),
  hasSupabase: Boolean(extra.supabaseUrl?.trim() && extra.supabaseAnonKey?.trim()),
};
