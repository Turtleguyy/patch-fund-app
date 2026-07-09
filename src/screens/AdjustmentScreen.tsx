import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { EntryFormFields } from '../components/EntryFormFields';
import { EntrySuggestionRow } from '../components/EntrySuggestionRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { LedgerEntry } from '../models/LedgerEntry';
import { allowanceService } from '../services/allowanceService';
import { LogDirection, storageService } from '../services/storageService';
import { EntrySuggestion, getTopEntrySuggestions } from '../utils/entrySuggestions';
import {
  amountDeltaToAmountText,
  amountDeltaToDirection,
  directionAndAmountToDelta,
  showEntryFormValidationAlert,
  validateEntryForm,
} from '../utils/entryForm';
import { HistoryStackParamList, HomeStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme';

type Props =
  | NativeStackScreenProps<HomeStackParamList, 'Adjustment'>
  | NativeStackScreenProps<HistoryStackParamList, 'EditEntry'>;

type Direction = LogDirection;

export function AdjustmentScreen({ route, navigation }: Props) {
  const { childId, entryId } = route.params;
  const isEditing = Boolean(entryId);

  const [direction, setDirection] = useState<Direction>('add');
  const [amountText, setAmountText] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void Promise.all([
        allowanceService.loadAppState(),
        isEditing ? Promise.resolve(null) : storageService.getLastLogDirection(),
      ]).then(([state, lastDirection]) => {
        if (!active) return;

        const childEntries = state.entries.filter((entry) => entry.childId === childId);
        setEntries(childEntries);

        if (isEditing && entryId) {
          const entry = childEntries.find((item) => item.id === entryId);
          if (!entry) {
            Alert.alert('Entry not found', 'This entry may have been deleted.');
            navigation.goBack();
            return;
          }
          setDirection(amountDeltaToDirection(entry.amountDelta));
          setAmountText(amountDeltaToAmountText(entry.amountDelta));
          setReason(entry.reason);
          setLoading(false);
          return;
        }

        if (lastDirection) {
          setDirection(lastDirection);
        }
        setLoading(false);
      });

      return () => {
        active = false;
      };
    }, [childId, entryId, isEditing, navigation]),
  );

  const handleDirectionChange = useCallback((next: Direction) => {
    setDirection(next);
    if (!isEditing) {
      void storageService.setLastLogDirection(next);
    }
  }, [isEditing]);

  const suggestions = useMemo(
    () => (isEditing ? [] : getTopEntrySuggestions(entries, childId)),
    [entries, childId, isEditing],
  );

  const applySuggestion = useCallback((suggestion: EntrySuggestion) => {
    const nextDirection: Direction = suggestion.amountDelta >= 0 ? 'add' : 'take';
    setDirection(nextDirection);
    void storageService.setLastLogDirection(nextDirection);
    setAmountText(amountDeltaToAmountText(suggestion.amountDelta));
    setReason(suggestion.reason);
  }, []);

  const handleSave = useCallback(async () => {
    const validationError = validateEntryForm(amountText, reason);
    if (validationError) {
      showEntryFormValidationAlert(validationError);
      return;
    }

    const amountDelta = directionAndAmountToDelta(direction, amountText);

    setSaving(true);
    try {
      if (!isEditing) {
        await storageService.setLastLogDirection(direction);
        await allowanceService.addEntry({
          childId,
          amountDelta,
          reason: reason.trim(),
          source: 'manual',
        });
      } else if (entryId) {
        await allowanceService.updateEntry(entryId, {
          amountDelta,
          reason: reason.trim(),
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not save entry.');
    } finally {
      setSaving(false);
    }
  }, [amountText, reason, direction, childId, entryId, isEditing, navigation]);

  if (loading) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{isEditing ? 'Edit entry' : 'Log an entry'}</Text>
        <Text style={styles.subtitle}>
          {isEditing ? 'Update the amount or note.' : 'Add money earned or take some away.'}
        </Text>

        {suggestions.length > 0 ? (
          <>
            <Text style={styles.suggestionsLabel}>Suggestions</Text>
            <EntrySuggestionRow suggestions={suggestions} onSelect={applySuggestion} />
          </>
        ) : null}

        <EntryFormFields
          direction={direction}
          onDirectionChange={handleDirectionChange}
          amountText={amountText}
          onAmountTextChange={setAmountText}
          reason={reason}
          onReasonChange={setReason}
          reasonHint={isEditing ? undefined : "A quick note you'll recognize later."}
        />

        <View style={styles.actions}>
          <PrimaryButton label={saving ? 'Saving…' : 'Save'} onPress={handleSave} />
          <PrimaryButton label="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
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
  actions: {
    marginTop: spacing.sm,
  },
});
