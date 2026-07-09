import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { formatAppleFullName, profileService } from './profileService';
import {
  isGoogleSignInConfigured,
  signInWithGoogleNative,
  signOutGoogleNative,
} from './googleSignIn';

function isUserCancelError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('ERR_REQUEST_CANCELED');
}

export const authService = {
  isCloudAuthEnabled(): boolean {
    return isSupabaseConfigured();
  },

  isAppleAvailable(): boolean {
    return isSupabaseConfigured() && Platform.OS === 'ios';
  },

  isGoogleAvailable(): boolean {
    return isSupabaseConfigured();
  },

  async getSession() {
    if (!isSupabaseConfigured()) return null;
    const { data } = await getSupabase().auth.getSession();
    return data.session;
  },

  async signInWithApple(): Promise<void> {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple Sign In did not return an identity token.');
    }

    const { error } = await getSupabase().auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) throw error;

    const appleName = formatAppleFullName(credential.fullName);
    if (appleName) {
      await profileService.updateDisplayName(appleName);
    }
  },

  async signInWithGoogle(): Promise<void> {
    await signInWithGoogleNative();
  },

  isUserCancelError,

  async signOut(): Promise<void> {
    if (!isSupabaseConfigured()) return;
    await signOutGoogleNative();
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
  },

  onAuthStateChange(listener: (signedIn: boolean) => void) {
    if (!isSupabaseConfigured()) return () => {};
    const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
      listener(Boolean(session));
    });
    return () => data.subscription.unsubscribe();
  },
};
