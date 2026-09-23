import { StyleSheet, Text, View } from 'react-native';
import { formatMoney } from '../utils/formatMoney';
import { balanceColors, colors, radii, spacing, typography } from '../theme';

interface BalanceCardProps {
  childName: string;
  balance: number;
  weeklyStartingAmount: number;
  weekStartedAt: string;
  compact?: boolean;
}

function formatWeekStarted(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function BalanceCard({
  childName,
  balance,
  weeklyStartingAmount,
  weekStartedAt,
  compact = false,
}: BalanceCardProps) {
  const tone = balanceColors(balance);

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        { backgroundColor: tone.surface, borderColor: tone.border },
      ]}
    >
      <Text style={[styles.childName, compact && styles.childNameCompact]}>{childName}</Text>
      <Text style={styles.label}>Allowance this week</Text>
      <Text style={[styles.balance, compact && styles.balanceCompact, { color: tone.amount }]}>
        {formatMoney(balance)}
      </Text>
      <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
        Started at {formatMoney(weeklyStartingAmount)} · {formatWeekStarted(weekStartedAt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  cardCompact: {
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  childName: {
    ...typography.heading,
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  childNameCompact: {
    fontSize: 18,
  },
  label: {
    ...typography.caption,
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  balance: {
    fontSize: 72,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 76,
  },
  balanceCompact: {
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: spacing.md,
    ...typography.caption,
    fontSize: 15,
  },
  subtitleCompact: {
    marginTop: spacing.sm,
    fontSize: 14,
  },
});
