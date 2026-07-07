import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { FormField, formStyles } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { AuthStackParamList } from '../navigation/types';
import { householdService } from '../services/householdService';
import { storageService } from '../services/storageService';
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'HouseholdOnboarding'>;

export function HouseholdOnboardingScreen(_props: Props) {
  const { setHousehold } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [importLocalData, setImportLocalData] = useState(false);

  useEffect(() => {
    (async () => {
      const children = await storageService.getChildren();
      setHasLocalData(children.length > 0);
    })();
  }, []);

  const handleCreate = useCallback(async () => {
    setBusy('create');
    try {
      const household = await householdService.createHousehold();
      if (hasLocalData && importLocalData) {
        await householdService.importLocalDataToHousehold(household.id);
      }
      setHousehold(household);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not create household.');
    } finally {
      setBusy(null);
    }
  }, [hasLocalData, importLocalData, setHousehold]);

  const handleJoin = useCallback(async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Enter a code', 'Ask the other parent for their household invite code.');
      return;
    }

    setBusy('join');
    try {
      const household = await householdService.joinHousehold(inviteCode);
      setHousehold(household);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not join household.');
    } finally {
      setBusy(null);
    }
  }, [inviteCode, setHousehold]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Your household</Text>
        <Text style={styles.subtitle}>
          Create a household for your family, or join one with an invite code from another parent.
        </Text>

        {hasLocalData ? (
          <Pressable
            style={styles.importRow}
            onPress={() => setImportLocalData((value) => !value)}
          >
            <View style={[styles.checkbox, importLocalData && styles.checkboxChecked]}>
              {importLocalData ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.importLabel}>
              Copy kids already on this device into the new household
            </Text>
          </Pressable>
        ) : null}

        <PrimaryButton
          label={busy === 'create' ? 'Creating…' : 'Create household'}
          onPress={handleCreate}
        />

        <Text style={styles.dividerLabel}>or join existing</Text>

        <FormField label="Invite code">
          <TextInput
            style={[formStyles.input, styles.codeInput]}
            value={inviteCode}
            onChangeText={setInviteCode}
            placeholder="ABC123"
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </FormField>

        <PrimaryButton
          label={busy === 'join' ? 'Joining…' : 'Join household'}
          variant="secondary"
          onPress={handleJoin}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  note: {
    ...typography.caption,
    fontSize: 15,
    marginBottom: spacing.md,
    color: colors.accent,
  },
  importRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxChecked: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  checkmark: {
    color: colors.accent,
    fontWeight: '700',
  },
  importLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  dividerLabel: {
    ...typography.label,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 4,
    fontWeight: '700',
  },
});
