import { RefObject, useEffect, useRef, useState } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FormField, formStyles } from './FormField';
import { LogDirection } from '../services/storageService';
import { colors, radii, spacing } from '../theme';

const AMOUNT_ACCESSORY_ID = 'patchfund-amount-accessory';

export interface EntryFormFieldsProps {
  direction: LogDirection;
  onDirectionChange: (direction: LogDirection) => void;
  amountText: string;
  onAmountTextChange: (text: string) => void;
  reason: string;
  onReasonChange: (text: string) => void;
  reasonHint?: string;
  reasonPlaceholder?: string;
  autoFocusAmount?: boolean;
  reasonContainerRef?: RefObject<View | null>;
  onReasonFocus?: () => void;
  onReasonBlur?: () => void;
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
  autoFocusAmount = false,
  reasonContainerRef,
  onReasonFocus,
  onReasonBlur,
}: EntryFormFieldsProps) {
  const amountRef = useRef<TextInput>(null);
  const reasonRef = useRef<TextInput>(null);
  const [amountFocused, setAmountFocused] = useState(false);

  useEffect(() => {
    if (!autoFocusAmount) return;
    // Delay past the navigation transition so focus isn't stolen.
    const timer = setTimeout(() => amountRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [autoFocusAmount]);

  const focusReason = () => {
    // Used by the decimal-pad accessory. Focusing reason transfers first responder
    // without an intermediate keyboard dismiss.
    const tryFocus = () => reasonRef.current?.focus();
    tryFocus();
    setTimeout(tryFocus, 50);
    setTimeout(tryFocus, 150);
  };

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
          <Text style={styles.currency} pointerEvents="none">
            $
          </Text>
          <TextInput
            ref={amountRef}
            style={[formStyles.input, formStyles.inputLarge, styles.amountInput]}
            value={amountText}
            onChangeText={onAmountTextChange}
            placeholder="0"
            placeholderTextColor={colors.border}
            keyboardType="decimal-pad"
            inputMode="decimal"
            returnKeyType="done"
            blurOnSubmit={false}
            onFocus={() => setAmountFocused(true)}
            onBlur={() => setAmountFocused(false)}
            inputAccessoryViewID={Platform.OS === 'ios' ? AMOUNT_ACCESSORY_ID : undefined}
          />
        </View>
      </FormField>

      <View
        ref={reasonContainerRef}
        style={amountFocused ? styles.reasonRaised : undefined}
        collapsable={false}
        // Claim the touch before the focused amount field can resign without a
        // successor — then focus reason the same way the accessory Next button does.
        onStartShouldSetResponderCapture={() => {
          if (!amountFocused) return false;
          focusReason();
          return true;
        }}
      >
        <FormField label="What for?" hint={reasonHint}>
          <TextInput
            ref={reasonRef}
            style={formStyles.input}
            value={reason}
            onChangeText={onReasonChange}
            placeholder={reasonPlaceholder}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            onFocus={() => {
              setAmountFocused(false);
              onReasonFocus?.();
            }}
            onBlur={onReasonBlur}
          />
        </FormField>
      </View>

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={AMOUNT_ACCESSORY_ID}>
          <View style={styles.accessory}>
            <Pressable onPress={Keyboard.dismiss} hitSlop={8}>
              <Text style={styles.accessoryAction}>Done</Text>
            </Pressable>
            <Pressable onPress={focusReason} hitSlop={8}>
              <Text style={[styles.accessoryAction, styles.accessoryPrimary]}>Next</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
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
    overflow: 'hidden',
    borderRadius: 16,
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
    height: 84,
    paddingVertical: 0,
  },
  reasonRaised: {
    zIndex: 20,
    elevation: 20,
  },
  accessory: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  accessoryAction: {
    fontSize: 17,
    color: colors.textMuted,
    fontWeight: '600',
    paddingVertical: spacing.xs,
  },
  accessoryPrimary: {
    color: colors.accent,
  },
});
