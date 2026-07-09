import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SocialSignInButton } from '../components/SocialSignInButton';
import { AuthStackParamList } from '../navigation/types';
import { authService } from '../services/authService';
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;
type SignInProvider = 'apple' | 'google';

export function SignInScreen(_props: Props) {
  const [loadingProvider, setLoadingProvider] = useState<SignInProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState<boolean | null>(null);
  const googleAvailable = authService.isGoogleAvailable();

  useEffect(() => {
    if (!authService.isAppleAvailable()) {
      setAppleAvailable(false);
      return;
    }

    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  const runSignIn = useCallback(async (provider: SignInProvider, action: () => Promise<void>) => {
    setLoadingProvider(provider);
    setError(null);
    try {
      await action();
    } catch (err) {
      if (authService.isUserCancelError(err)) {
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setLoadingProvider(null);
    }
  }, []);

  const handleAppleSignIn = useCallback(() => {
    void runSignIn('apple', () => authService.signInWithApple());
  }, [runSignIn]);

  const handleGoogleSignIn = useCallback(() => {
    void runSignIn('google', () => authService.signInWithGoogle());
  }, [runSignIn]);

  const busy = loadingProvider !== null;
  const checkingApple = appleAvailable === null;
  const hasSignInOption = appleAvailable || googleAvailable;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patch Fund</Text>
      <Text style={styles.subtitle}>
        Sign in to sync allowance with your household. Each sign-in method is a separate account.
      </Text>

      {checkingApple ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.spinner} />
      ) : (
        <View style={[styles.buttons, busy && styles.buttonsBusy]} pointerEvents={busy ? 'none' : 'auto'}>
          {appleAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={12}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          ) : null}

          {googleAvailable ? (
            <SocialSignInButton
              label="Continue with Google"
              onPress={handleGoogleSignIn}
              loading={loadingProvider === 'google'}
              disabled={busy}
              backgroundColor="#fff"
              textColor={colors.text}
              borderColor={colors.border}
            />
          ) : null}
        </View>
      )}

      {!checkingApple && !hasSignInOption ? (
        <Text style={styles.error}>No sign-in methods are configured for this build.</Text>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.title,
    fontSize: 36,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttons: {
    width: '100%',
  },
  buttonsBusy: {
    opacity: 0.7,
  },
  appleButton: {
    width: '100%',
    height: 52,
    marginBottom: spacing.sm,
  },
  spinner: {
    marginVertical: spacing.lg,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
