import { StyleSheet, Text, View } from 'react-native';
import { formatMoney } from '../utils/formatMoney';
import { balanceColors, colors, radii, spacing, typography } from '../theme';

interface BalanceCardProps {
  childName: string;
  balance: number;
  weeklyStartingAmount: number;
}

export function BalanceCard({ childName, balance, weeklyStartingAmount }: BalanceCardProps) {
  const tone = balanceColors(balance);

  return (
    <View style={[styles.card, { backgroundColor: tone.surface, borderColor: tone.border }]}>
      <Text style={styles.childName}>{childName}</Text>
      <Text style={styles.label}>Allowance this week</Text>
      <Text style={[styles.balance, { color: tone.amount }]}>{formatMoney(balance)}</Text>
      <Text style={styles.subtitle}>Started at {formatMoney(weeklyStartingAmount)}</Text>
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
  childName: {
    ...typography.heading,
    fontSize: 20,
    marginBottom: spacing.xs,
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
  subtitle: {
    marginTop: spacing.md,
    ...typography.caption,
    fontSize: 15,
  },
});
