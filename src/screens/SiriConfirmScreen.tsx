import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { commitSiriEntry } from '../services/siriEntryService';
import { formatMoney } from '../utils/formatMoney';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SiriConfirm'>;

export function SiriConfirmScreen({ route, navigation }: Props) {
  const pending = route.params.pending;
  const [saving, setSaving] = useState(false);

  const handleConfirm = useCallback(async () => {
    setSaving(true);
    try {
      await commitSiriEntry(pending);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'HomeTab', params: { screen: 'Home' } } }],
      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not save entry.');
    } finally {
      setSaving(false);
    }
  }, [pending, navigation]);

  const handleCancel = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'HomeTab', params: { screen: 'Home' } } }],
    });
  }, [navigation]);

  const amount =
    pending.parsed.amountDelta > 0
      ? `+${formatMoney(pending.parsed.amountDelta)}`
      : formatMoney(pending.parsed.amountDelta);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>From Siri</Text>
      <Text style={styles.subtitle}>Does this look right?</Text>

      <View style={styles.card}>
        <Text style={styles.amount}>{amount}</Text>
        <Text style={styles.reason}>{pending.parsed.reason}</Text>
        <Text style={styles.child}>for {pending.childName}</Text>
      </View>

      <Text style={styles.heard}>"{pending.spokenText}"</Text>

      {pending.parsed.needsConfirmation ? (
        <Text style={styles.warning}>
          We're not totally sure about this one — double-check before saving.
        </Text>
      ) : null}

      <PrimaryButton label={saving ? 'Saving…' : 'Save'} onPress={handleConfirm} />
      <PrimaryButton label="Discard" variant="secondary" onPress={handleCancel} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  title: {
    ...typography.title,
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  amount: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  reason: {
    fontSize: 20,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  child: {
    ...typography.caption,
    fontSize: 16,
  },
  heard: {
    ...typography.caption,
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  warning: {
    color: '#b45309',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
