import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Child } from '../models/Child';
import { colors, radii, spacing, typography } from '../theme';

interface ChildSelectorProps {
  children: Child[];
  selectedChildId: string;
  onSelect: (childId: string) => void;
}

export function ChildSelector({ children, selectedChildId, onSelect }: ChildSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Who&apos;s this for?</Text>
      <View style={styles.row}>
        {children.map((child) => {
          const selected = child.id === selectedChildId;
          return (
            <Pressable
              key={child.id}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onSelect(child.id)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {child.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  chipSelected: {
    backgroundColor: colors.accent,
  },
  chipText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
});
