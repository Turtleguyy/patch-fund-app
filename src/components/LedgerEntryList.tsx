import { FlatList, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { LedgerEntry } from '../models/LedgerEntry';
import { formatMoney } from '../utils/formatMoney';
import { colors, radii, spacing, typography } from '../theme';

interface LedgerEntryListProps {
  entries: LedgerEntry[];
  emptyMessage?: string;
  onPress?: (entry: LedgerEntry) => void;
  onDelete?: (entry: LedgerEntry) => void;
  scrollEnabled?: boolean;
  style?: StyleProp<ViewStyle>;
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

function EntryRow({ item, onPress }: { item: LedgerEntry; onPress?: (entry: LedgerEntry) => void }) {
  const content = (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.reason}>{item.reason}</Text>
        <Text style={styles.meta}>
          {formatDate(item.createdAt)}
          {item.loggedByName ? ` · ${item.loggedByName}` : ''}
        </Text>
      </View>
      <Text style={[styles.amount, item.amountDelta < 0 && styles.amountNegative]}>
        {item.amountDelta > 0 ? '+' : ''}
        {formatMoney(item.amountDelta)}
      </Text>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [pressed && styles.rowPressed]}
    >
      {content}
    </Pressable>
  );
}

export function LedgerEntryList({
  entries,
  emptyMessage = 'Nothing logged yet this week.',
  onPress,
  onDelete,
  scrollEnabled = false,
  style,
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
      scrollEnabled={scrollEnabled}
      style={style}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const row = <EntryRow item={item} onPress={onPress} />;

        if (!onDelete) {
          return row;
        }

        return (
          <Swipeable
            renderRightActions={() => (
              <Pressable style={styles.deleteAction} onPress={() => onDelete(item)}>
                <Text style={styles.deleteLabel}>Delete</Text>
              </Pressable>
            )}
            overshootRight={false}
          >
            <View style={styles.swipeableRow}>{row}</View>
          </Swipeable>
        );
      }}
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
  swipeableRow: {
    backgroundColor: colors.background,
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
  rowPressed: {
    opacity: 0.7,
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
  deleteAction: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 88,
    marginBottom: 1,
    borderTopRightRadius: radii.md,
    borderBottomRightRadius: radii.md,
  },
  deleteLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
