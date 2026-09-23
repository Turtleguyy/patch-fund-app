import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChildSelector } from '../components/ChildSelector';
import { PrimaryButton } from '../components/PrimaryButton';
import { Child } from '../models/Child';
import { WeekHistoryItem } from '../models/WeekSummary';
import { allowanceService } from '../services/allowanceService';
import { formatMoney } from '../utils/formatMoney';
import { formatWeekRange } from '../utils/weekUtils';
import { HistoryStackParamList } from '../navigation/types';
import { balanceColors, colors, radii, spacing, typography } from '../theme';
import { useCloudSync } from '../hooks/useCloudSync';

type Props = NativeStackScreenProps<HistoryStackParamList, 'History'>;

export function HistoryScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [weeks, setWeeks] = useState<WeekHistoryItem[]>([]);

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) ?? null,
    [children, selectedChildId],
  );

  const load = useCallback(async () => {
    const state = await allowanceService.loadAppState();
    setChildren(state.children);
    setSelectedChildId(state.selectedChildId);

    if (state.selectedChildId) {
      const history = await allowanceService.getWeekHistory(state.selectedChildId);
      setWeeks(history);
    } else {
      setWeeks([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        await load();
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [load]),
  );

  useCloudSync(load);

  const handleSelectChild = useCallback(
    async (childId: string) => {
      await allowanceService.selectChild(childId);
      setSelectedChildId(childId);
      const history = await allowanceService.getWeekHistory(childId);
      setWeeks(history);
    },
    [],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!selectedChild) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No kids yet</Text>
        <Text style={styles.emptySubtitle}>Add a child to see past weeks.</Text>
        <PrimaryButton label="Go to Household" onPress={() => navigation.getParent()?.navigate('KidsTab')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {children.length > 1 ? (
          <ChildSelector
            children={children}
            selectedChildId={selectedChild.id}
            onSelect={handleSelectChild}
          />
        ) : null}
      </View>

      {weeks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No past weeks yet</Text>
          <Text style={styles.emptySubtitle}>
            When you start a new week, the finished week shows up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={weeks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={children.length > 1 ? null : <View style={styles.listTopSpacer} />}
          renderItem={({ item }) => (
            <WeekRow
              week={item}
              onPress={() =>
                navigation.navigate('WeekHistoryDetail', { childId: selectedChild.id, weekId: item.id })
              }
            />
          )}
        />
      )}
    </View>
  );
}

function WeekRow({ week, onPress }: { week: WeekHistoryItem; onPress: () => void }) {
  const tone = balanceColors(week.endingBalance);

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowDates}>{formatWeekRange(week.startedAt, week.endedAt)}</Text>
        <Text style={styles.rowMeta}>Started at {formatMoney(week.weeklyStartingAmount)}</Text>
      </View>
      <Text style={[styles.rowAmount, { color: tone.amount }]}>{formatMoney(week.endingBalance)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  listTopSpacer: {
    height: spacing.sm,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyTitle: {
    ...typography.heading,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.caption,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  rowLeft: {
    flex: 1,
  },
  rowDates: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  rowMeta: {
    ...typography.caption,
    fontSize: 15,
  },
  rowAmount: {
    fontSize: 22,
    fontWeight: '700',
  },
});
