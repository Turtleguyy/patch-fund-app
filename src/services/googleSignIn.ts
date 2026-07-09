import {
  GoogleSignin,
  isCancelledResponse,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { env } from '../config/env';
import { getSupabase } from '../lib/supabase';
import { profileService } from './profileService';

let configured = false;

export function isGoogleSignInConfigured(): boolean {
  if (!env.googleAuthWebClientId) {
    return false;
  }

  if (Platform.OS === 'ios') {
    return Boolean(env.googleAuthIosClientId);
  }

  return true;
}

export function configureGoogleSignIn(): void {
  if (configured || !isGoogleSignInConfigured()) {
    return;
  }

  GoogleSignin.configure({
    webClientId: env.googleAuthWebClientId,
    ...(Platform.OS === 'ios' && env.googleAuthIosClientId
      ? { iosClientId: env.googleAuthIosClientId }
      : {}),
  });
  configured = true;
}

export async function signInWithGoogleNative(): Promise<void> {
  configureGoogleSignIn();

  if (!isGoogleSignInConfigured()) {
    throw new Error(
      'Google sign-in is not configured. Add EXPO_PUBLIC_GOOGLE_AUTH_WEB_CLIENT_ID and EXPO_PUBLIC_GOOGLE_AUTH_IOS_CLIENT_ID to .env, then restart Metro and rebuild the app.',
    );
  }

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const response = await GoogleSignin.signIn();

  if (isCancelledResponse(response)) {
    throw new Error('ERR_REQUEST_CANCELED');
  }

  if (!isSuccessResponse(response)) {
    throw new Error('Google Sign In did not complete.');
  }

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error('Google Sign In did not return an identity token.');
  }

  const { error } = await getSupabase().auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) throw error;

  const { user } = response.data;
  const name =
    user.name?.trim() ||
    [user.givenName, user.familyName]
      .filter((part): part is string => Boolean(part?.trim()))
      .join(' ')
      .trim() ||
    null;

  if (name) {
    await profileService.updateDisplayName(name);
  }
}

export async function signOutGoogleNative(): Promise<void> {
  if (!isGoogleSignInConfigured()) {
    return;
  }

  configureGoogleSignIn();

  try {
    await GoogleSignin.signOut();
  } catch {
    // Ignore — user may not have signed in with Google.
  }
}
