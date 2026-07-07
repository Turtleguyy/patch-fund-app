import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing } from '../theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function PrimaryButton({ label, onPress, variant = 'primary' }: PrimaryButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.label,
          variant === 'secondary' && styles.secondaryLabel,
          variant === 'danger' && styles.dangerLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  secondary: {
    backgroundColor: colors.surfaceMuted,
  },
  danger: {
    backgroundColor: colors.dangerLight,
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryLabel: {
    color: colors.text,
  },
  dangerLabel: {
    color: colors.danger,
  },
});
