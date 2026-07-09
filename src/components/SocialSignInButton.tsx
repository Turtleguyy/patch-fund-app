import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing } from '../theme';

interface SocialSignInButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  backgroundColor: string;
  textColor?: string;
  borderColor?: string;
}

export function SocialSignInButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  backgroundColor,
  textColor = '#fff',
  borderColor,
}: SocialSignInButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, borderColor: borderColor ?? backgroundColor },
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 52,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.9,
  },
});
