import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EntrySuggestion, formatSuggestionAmount } from '../utils/entrySuggestions';
import { colors, radii, spacing, typography } from '../theme';

interface EntrySuggestionRowProps {
  suggestions: EntrySuggestion[];
  onSelect: (suggestion: EntrySuggestion) => void;
  disabled?: boolean;
}

export function EntrySuggestionRow({
  suggestions,
  onSelect,
  disabled = false,
}: EntrySuggestionRowProps) {
  if (suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      {suggestions.map((suggestion) => {
        const amountColor = suggestion.amountDelta >= 0 ? colors.positive : colors.danger;
        const key = `${suggestion.amountDelta}-${suggestion.reason}`;

        return (
          <Pressable
            key={key}
            style={({ pressed }) => [
              styles.chip,
              pressed && !disabled && styles.chipPressed,
              disabled && styles.chipDisabled,
            ]}
            onPress={() => onSelect(suggestion)}
            disabled={disabled}
          >
            <Text style={[styles.amount, { color: amountColor }]}>
              {formatSuggestionAmount(suggestion.amountDelta)}
            </Text>
            <Text style={styles.reason} numberOfLines={1}>
              {suggestion.reason}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  chipPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  chipDisabled: {
    opacity: 0.6,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 56,
  },
  reason: {
    ...typography.body,
    flex: 1,
    fontSize: 16,
  },
});
