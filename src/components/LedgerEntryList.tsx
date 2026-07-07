import { FlatList, StyleSheet, Text, View } from 'react-native';
import { LedgerEntry } from '../models/LedgerEntry';
import { formatMoney } from '../utils/formatMoney';
import { colors, spacing, typography } from '../theme';

interface LedgerEntryListProps {
  entries: LedgerEntry[];
  emptyMessage?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function LedgerEntryList({
  entries,
  emptyMessage = 'Nothing logged yet this week.',
}: LedgerEntryListProps) {
  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.left}>
            <Text style={styles.reason}>{item.reason}</Text>
            <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
          </View>
          <Text style={[styles.amount, item.amountDelta < 0 && styles.amountNegative]}>
            {item.amountDelta > 0 ? '+' : ''}
            {formatMoney(item.amountDelta)}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: spacing.lg,
  },
  empty: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.caption,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  left: {
    flex: 1,
  },
  reason: {
    fontSize: 17,
    color: colors.text,
    marginBottom: 4,
  },
  meta: {
    ...typography.caption,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.positive,
  },
  amountNegative: {
    color: colors.negative,
  },
});
