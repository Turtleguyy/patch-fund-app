import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginBottom: spacing.sm,
    marginHorizontal: -spacing.lg,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    maxWidth: 220,
  },
  chipPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  chipDisabled: {
    opacity: 0.6,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
  reason: {
    ...typography.body,
    flexShrink: 1,
    fontSize: 15,
    maxWidth: 140,
  },
});
