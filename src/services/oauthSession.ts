import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Provider } from '@supabase/supabase-js';
import { env } from '../config/env';
import { getSupabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = Extract<Provider, 'google' | 'facebook'>;

export function getOAuthRedirectUri(): string {
  return makeRedirectUri({
    scheme: env.scheme,
    path: 'auth/callback',
  });
}

export async function createSessionFromUrl(url: string): Promise<void> {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(errorCode);
  }

  if (params.code) {
    const { error } = await getSupabase().auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return;
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  if (!accessToken) {
    throw new Error('Sign in did not return a session.');
  }

  const { error } = await getSupabase().auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw error;
}

export async function signInWithOAuthProvider(provider: OAuthProvider): Promise<void> {
  const redirectTo = getOAuthRedirectUri();

  const { data, error } = await getSupabase().auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) {
    throw new Error('Could not start sign in.');
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === 'success') {
    await createSessionFromUrl(result.url);
    return;
  }

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('ERR_REQUEST_CANCELED');
  }

  throw new Error('Sign in was not completed.');
}
