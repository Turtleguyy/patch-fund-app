import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FormField, formStyles } from './FormField';
import { LogDirection } from '../services/storageService';
import { colors, radii, spacing } from '../theme';

export interface EntryFormFieldsProps {
  direction: LogDirection;
  onDirectionChange: (direction: LogDirection) => void;
  amountText: string;
  onAmountTextChange: (text: string) => void;
  reason: string;
  onReasonChange: (text: string) => void;
  reasonHint?: string;
  reasonPlaceholder?: string;
}

export function EntryFormFields({
  direction,
  onDirectionChange,
  amountText,
  onAmountTextChange,
  reason,
  onReasonChange,
  reasonHint,
  reasonPlaceholder = 'Mowed the lawn',
}: EntryFormFieldsProps) {
  return (
    <>
      <View style={styles.directionRow}>
        <DirectionButton
          label="Add"
          selected={direction === 'add'}
          onPress={() => onDirectionChange('add')}
          tone="positive"
        />
        <DirectionButton
          label="Take"
          selected={direction === 'take'}
          onPress={() => onDirectionChange('take')}
          tone="negative"
        />
      </View>

      <FormField label="Amount">
        <View style={styles.amountWrap}>
          <Text style={styles.currency}>$</Text>
          <TextInput
            style={[formStyles.input, formStyles.inputLarge, styles.amountInput]}
            value={amountText}
            onChangeText={onAmountTextChange}
            placeholder="0"
            placeholderTextColor={colors.border}
            keyboardType="decimal-pad"
            inputMode="decimal"
            returnKeyType="done"
          />
        </View>
      </FormField>

      <FormField label="What for?" hint={reasonHint}>
        <TextInput
          style={formStyles.input}
          value={reason}
          onChangeText={onReasonChange}
          placeholder={reasonPlaceholder}
          returnKeyType="done"
        />
      </FormField>
    </>
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
});
