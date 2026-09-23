import Constants from 'expo-constants';
import { APP_IDENTITY } from './appIdentity.js';

type AppExtra = {
  scheme?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  googleAuthWebClientId?: string;
  googleAuthIosClientId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

function readEnv(extraValue: string | undefined, publicKey: string): string {
  return extraValue?.trim() || process.env[publicKey]?.trim() || '';
}

export const env = {
  scheme: extra.scheme ?? APP_IDENTITY.scheme,
  supabaseUrl: readEnv(extra.supabaseUrl, 'EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: readEnv(extra.supabaseAnonKey, 'EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  googleAuthWebClientId: readEnv(
    extra.googleAuthWebClientId,
    'EXPO_PUBLIC_GOOGLE_AUTH_WEB_CLIENT_ID',
  ),
  googleAuthIosClientId: readEnv(
    extra.googleAuthIosClientId,
    'EXPO_PUBLIC_GOOGLE_AUTH_IOS_CLIENT_ID',
  ),
  hasSupabase: Boolean(
    readEnv(extra.supabaseUrl, 'EXPO_PUBLIC_SUPABASE_URL') &&
      readEnv(extra.supabaseAnonKey, 'EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  ),
};
