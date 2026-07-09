import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
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
import { FormField, formStyles } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { commitSiriEntry } from '../services/siriEntryService';
import { LogDirection } from '../services/storageService';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SiriConfirm'>;
type Direction = LogDirection;

export function SiriConfirmScreen({ route, navigation }: Props) {
  const pending = route.params.pending;
  const [direction, setDirection] = useState<Direction>(
    pending.parsed.amountDelta >= 0 ? 'add' : 'take',
  );
  const [amountText, setAmountText] = useState(String(Math.abs(pending.parsed.amountDelta) || ''));
  const [reason, setReason] = useState(pending.parsed.reason);
  const [saving, setSaving] = useState(false);

  const goHome = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'HomeTab', params: { screen: 'Home' } } }],
    });
  }, [navigation]);

  const handleConfirm = useCallback(async () => {
    const amount = Number(amountText);
    if (!amountText.trim() || Number.isNaN(amount) || amount <= 0) {
      Alert.alert('Enter an amount', 'Use a number greater than zero.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Add a note', 'What was this for?');
      return;
    }

    const amountDelta = direction === 'add' ? amount : -amount;

    setSaving(true);
    try {
      await commitSiriEntry(pending, {
        amountDelta,
        reason: reason.trim(),
      });
      goHome();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not save entry.');
    } finally {
      setSaving(false);
    }
  }, [amountText, reason, direction, pending, goHome]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>Does this look right?</Text>
        <Text style={styles.heard}>"{pending.spokenText}"</Text>

        {pending.parsed.needsConfirmation ? (
          <Text style={styles.warning}>
            We're not totally sure about this one — tweak anything before saving.
          </Text>
        ) : null}

        <Text style={styles.childLabel}>for {pending.childName}</Text>

        <View style={styles.directionRow}>
          <DirectionButton
            label="Add"
            selected={direction === 'add'}
            onPress={() => setDirection('add')}
            tone="positive"
          />
          <DirectionButton
            label="Take"
            selected={direction === 'take'}
            onPress={() => setDirection('take')}
            tone="negative"
          />
        </View>

        <FormField label="Amount">
          <View style={styles.amountWrap}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              style={[formStyles.input, formStyles.inputLarge, styles.amountInput]}
              value={amountText}
              onChangeText={setAmountText}
              placeholder="0"
              placeholderTextColor={colors.border}
              keyboardType="decimal-pad"
              inputMode="decimal"
              returnKeyType="done"
            />
          </View>
        </FormField>

        <FormField label="What for?">
          <TextInput
            style={formStyles.input}
            value={reason}
            onChangeText={setReason}
            placeholder="What was this for?"
            returnKeyType="done"
          />
        </FormField>

        <PrimaryButton label={saving ? 'Saving…' : 'Save'} onPress={handleConfirm} />
        <PrimaryButton label="Discard" variant="secondary" onPress={goHome} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DirectionButton({
  label,
  selected,
  onPress,
  tone,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone: 'positive' | 'negative';
}) {
  const selectedStyle =
    tone === 'positive'
      ? { backgroundColor: colors.positiveLight, borderColor: colors.positive }
      : { backgroundColor: colors.dangerLight, borderColor: colors.danger };
  const selectedTextStyle =
    tone === 'positive' ? { color: colors.positive } : { color: colors.danger };

  return (
    <Pressable
      style={[styles.directionButton, selected && selectedStyle]}
      onPress={onPress}
    >
      <Text style={[styles.directionLabel, selected && selectedTextStyle]}>{label}</Text>
    </Pressable>
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
  subtitle: {
    ...typography.caption,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  heard: {
    ...typography.caption,
    fontSize: 15,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  warning: {
    color: '#b45309',
    fontSize: 15,
    marginBottom: spacing.md,
  },
  childLabel: {
    ...typography.label,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  directionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  directionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  directionLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textMuted,
  },
  amountWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  currency: {
    position: 'absolute',
    left: spacing.md,
    fontSize: 32,
    fontWeight: '600',
    color: colors.textMuted,
    zIndex: 1,
  },
  amountInput: {
    paddingLeft: 44,
  },
});
