import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { formatAppleFullName, profileService } from './profileService';

export const authService = {
  isAvailable(): boolean {
    return isSupabaseConfigured() && Platform.OS === 'ios';
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

  async signOut(): Promise<void> {
    if (!isSupabaseConfigured()) return;
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
