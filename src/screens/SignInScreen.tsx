import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AuthStackParamList } from '../navigation/types';
import { authService } from '../services/authService';
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export function SignInScreen(_props: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  const handleSignIn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.signInWithApple();
    } catch (err) {
      if (err instanceof Error && err.message.includes('ERR_REQUEST_CANCELED')) {
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patch Fund</Text>
      <Text style={styles.subtitle}>
        Sign in to sync allowance with your household. Both parents see the same kids and entries.
      </Text>

      {appleAvailable === null || loading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.spinner} />
      ) : appleAvailable ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={12}
          style={styles.appleButton}
          onPress={handleSignIn}
        />
      ) : (
        <Text style={styles.error}>Sign in with Apple is not available on this device.</Text>
      )}

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
  appleButton: {
    width: '100%',
    height: 52,
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
