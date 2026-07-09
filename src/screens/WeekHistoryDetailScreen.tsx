import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LedgerEntryList } from '../components/LedgerEntryList';
import { LedgerEntry } from '../models/LedgerEntry';
import { WeekHistoryItem } from '../models/WeekSummary';
import { allowanceService } from '../services/allowanceService';
import { formatMoney } from '../utils/formatMoney';
import { formatWeekRange } from '../utils/weekUtils';
import { HistoryStackParamList } from '../navigation/types';
import { balanceColors, colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<HistoryStackParamList, 'WeekHistoryDetail'>;

export function WeekHistoryDetailScreen({ route, navigation }: Props) {
  const { childId, weekId } = route.params;
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState<WeekHistoryItem | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);

  const load = useCallback(async () => {
    const detail = await allowanceService.getWeekHistoryDetail(childId, weekId);
    setWeek(detail.week);
    setEntries(detail.entries);
  }, [childId, weekId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        await load();
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [load]),
  );

  const handleDeleteEntry = useCallback((entry: LedgerEntry) => {
    const amountLabel = `${entry.amountDelta > 0 ? '+' : ''}${formatMoney(entry.amountDelta)}`;
    Alert.alert('Delete entry?', `${entry.reason} (${amountLabel})`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await allowanceService.deleteEntry(entry.id);
            setEntries((prev) => prev.filter((item) => item.id !== entry.id));
          } catch (error) {
            Alert.alert(
              'Error',
              error instanceof Error ? error.message : 'Could not delete entry.',
            );
          }
        },
      },
    ]);
  }, []);

  const handleEditEntry = useCallback(
    (entry: LedgerEntry) => {
      navigation.navigate('EditEntry', { childId: entry.childId, entryId: entry.id });
    },
    [navigation],
  );

  if (loading || !week) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const tone = balanceColors(week.endingBalance);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.dates}>{formatWeekRange(week.startedAt, week.endedAt)}</Text>
      <View style={[styles.summaryCard, { backgroundColor: tone.surface, borderColor: tone.border }]}>
        <Text style={styles.summaryLabel}>Ended at</Text>
        <Text style={[styles.summaryAmount, { color: tone.amount }]}>
          {formatMoney(week.endingBalance)}
        </Text>
        <Text style={styles.summaryMeta}>Started at {formatMoney(week.weeklyStartingAmount)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Entries</Text>
      <LedgerEntryList
        entries={entries}
        emptyMessage="No entries this week."
        onPress={handleEditEntry}
        onDelete={handleDeleteEntry}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  dates: {
    ...typography.heading,
    fontSize: 22,
    marginBottom: spacing.md,
  },
  summaryCard: {
    borderRadius: radii.lg,
    borderWidth: 2,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  summaryLabel: {
    ...typography.caption,
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  summaryAmount: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  summaryMeta: {
    ...typography.caption,
    fontSize: 15,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
});
