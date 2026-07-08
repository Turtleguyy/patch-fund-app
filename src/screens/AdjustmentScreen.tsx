import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { EntrySuggestionRow } from '../components/EntrySuggestionRow';
import { FormField, formStyles } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { LedgerEntry } from '../models/LedgerEntry';
import { allowanceService } from '../services/allowanceService';
import { LogDirection, storageService } from '../services/storageService';
import { EntrySuggestion, getTopEntrySuggestions } from '../utils/entrySuggestions';
import { HomeStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Adjustment'>;
type Direction = LogDirection;

export function AdjustmentScreen({ route, navigation }: Props) {
  const { childId } = route.params;
  const [direction, setDirection] = useState<Direction>('add');
  const [amountText, setAmountText] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([
        allowanceService.loadAppState(),
        storageService.getLastLogDirection(),
      ]).then(([state, lastDirection]) => {
        if (!active) return;
        setEntries(state.entries.filter((entry) => entry.childId === childId));
        setDirection(lastDirection);
      });
      return () => {
        active = false;
      };
    }, [childId]),
  );

  const handleDirectionChange = useCallback((next: Direction) => {
    setDirection(next);
    void storageService.setLastLogDirection(next);
  }, []);

  const suggestions = useMemo(
    () => getTopEntrySuggestions(entries, childId),
    [entries, childId],
  );

  const applySuggestion = useCallback((suggestion: EntrySuggestion) => {
    const nextDirection: Direction = suggestion.amountDelta >= 0 ? 'add' : 'take';
    setDirection(nextDirection);
    void storageService.setLastLogDirection(nextDirection);
    setAmountText(String(Math.abs(suggestion.amountDelta)));
    setReason(suggestion.reason);
  }, []);

  const handleSave = useCallback(async () => {
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
      await storageService.setLastLogDirection(direction);
      await allowanceService.addEntry({
        childId,
        amountDelta,
        reason: reason.trim(),
        source: 'manual',
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not save entry.');
    } finally {
      setSaving(false);
    }
  }, [amountText, reason, direction, childId, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Log an entry</Text>
        <Text style={styles.subtitle}>Add money earned or take some away.</Text>

        {suggestions.length > 0 ? (
          <>
            <Text style={styles.suggestionsLabel}>Suggestions</Text>
            <EntrySuggestionRow suggestions={suggestions} onSelect={applySuggestion} />
          </>
        ) : null}

        <View style={styles.directionRow}>
          <DirectionButton
            label="Add"
            selected={direction === 'add'}
            onPress={() => handleDirectionChange('add')}
            tone="positive"
          />
          <DirectionButton
            label="Take"
            selected={direction === 'take'}
            onPress={() => handleDirectionChange('take')}
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

        <FormField label="What for?" hint="A quick note you'll recognize later.">
          <TextInput
            style={formStyles.input}
            value={reason}
            onChangeText={setReason}
            placeholder="Mowed the lawn"
            returnKeyType="done"
          />
        </FormField>

        <View style={styles.actions}>
          <PrimaryButton label={saving ? 'Saving…' : 'Save'} onPress={handleSave} />
          <PrimaryButton label="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
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
      style={[styles.directionButton, selected && styles.directionButtonSelected, selected && selectedStyle]}
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
  suggestionsLabel: {
    ...typography.label,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
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
    paddingVertical: 16,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  directionButtonSelected: {
    borderWidth: 2,
  },
  directionLabel: {
    fontSize: 18,
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
  actions: {
    marginTop: spacing.sm,
  },
});
