import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { EntryFormFields } from '../components/EntryFormFields';
import { PrimaryButton } from '../components/PrimaryButton';
import { commitSiriEntry } from '../services/siriEntryService';
import {
  amountDeltaToAmountText,
  amountDeltaToDirection,
  directionAndAmountToDelta,
  showEntryFormValidationAlert,
  validateEntryForm,
} from '../utils/entryForm';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SiriConfirm'>;

export function SiriConfirmScreen({ route, navigation }: Props) {
  const pending = route.params.pending;
  const [direction, setDirection] = useState(() => amountDeltaToDirection(pending.parsed.amountDelta));
  const [amountText, setAmountText] = useState(() => amountDeltaToAmountText(pending.parsed.amountDelta));
  const [reason, setReason] = useState(pending.parsed.reason);
  const [saving, setSaving] = useState(false);

  const goHome = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'HomeTab', params: { screen: 'Home' } } }],
    });
  }, [navigation]);

  const handleConfirm = useCallback(async () => {
    const validationError = validateEntryForm(amountText, reason);
    if (validationError) {
      showEntryFormValidationAlert(validationError);
      return;
    }

    const amountDelta = directionAndAmountToDelta(direction, amountText);

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

        <EntryFormFields
          direction={direction}
          onDirectionChange={setDirection}
          amountText={amountText}
          onAmountTextChange={setAmountText}
          reason={reason}
          onReasonChange={setReason}
          reasonPlaceholder="What was this for?"
        />

        <View style={styles.actions}>
          <PrimaryButton label={saving ? 'Saving…' : 'Save'} onPress={handleConfirm} />
          <PrimaryButton label="Discard" variant="secondary" onPress={goHome} />
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
  actions: {
    marginTop: spacing.sm,
  },
});
