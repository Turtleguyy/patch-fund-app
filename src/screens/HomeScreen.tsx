import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BalanceCard } from '../components/BalanceCard';
import { ChildSelector } from '../components/ChildSelector';
import { LedgerEntryList } from '../components/LedgerEntryList';
import { EntrySuggestionRow } from '../components/EntrySuggestionRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { Child } from '../models/Child';
import { LedgerEntry } from '../models/LedgerEntry';
import { allowanceService } from '../services/allowanceService';
import { storageService } from '../services/storageService';
import { EntrySuggestion, getTopEntrySuggestions } from '../utils/entrySuggestions';
import { calculateWeeklyBalance } from '../utils/weekUtils';
import { formatMoney } from '../utils/formatMoney';
import { useCloudSync } from '../hooks/useCloudSync';
import { HomeStackParamList, MainTabParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'Home'>,
  BottomTabScreenProps<MainTabParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [quickLogging, setQuickLogging] = useState(false);

  const load = useCallback(async () => {
    const state = await allowanceService.loadAppState();
    setChildren(state.children);
    setEntries(state.entries);
    setSelectedChildId(state.selectedChildId);
  }, []);

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

  useCloudSync(load);

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) ?? null,
    [children, selectedChildId],
  );

  const currentWeekEntries = useMemo(() => {
    if (!selectedChild) return [];
    const weekStart = new Date(selectedChild.weekStartedAt).getTime();
    return entries
      .filter(
        (entry) =>
          entry.childId === selectedChild.id && new Date(entry.createdAt).getTime() >= weekStart,
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [entries, selectedChild]);

  const balance = useMemo(() => {
    if (!selectedChild) return 0;
    return calculateWeeklyBalance(selectedChild.weeklyStartingAmount, currentWeekEntries);
  }, [selectedChild, currentWeekEntries]);

  const quickSuggestions = useMemo(() => {
    if (!selectedChild) return [];
    return getTopEntrySuggestions(entries, selectedChild.id);
  }, [entries, selectedChild]);

  const handleSelectChild = useCallback(async (childId: string) => {
    await allowanceService.selectChild(childId);
    setSelectedChildId(childId);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleCloseWeek = useCallback(() => {
    if (!selectedChild) return;

    Alert.alert(
      'Start a new week?',
      `${selectedChild.name} will get a fresh allowance. Past entries stay in history.`,
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Start new week',
          onPress: async () => {
            const updatedChild = await allowanceService.closeWeek(selectedChild.id);
            setChildren((prev) =>
              prev.map((child) => (child.id === updatedChild.id ? updatedChild : child)),
            );
          },
        },
      ],
    );
  }, [selectedChild]);

  const handleQuickLog = useCallback(
    async (suggestion: EntrySuggestion) => {
      if (!selectedChild || quickLogging) return;

      setQuickLogging(true);
      try {
        await storageService.setLastLogDirection(suggestion.amountDelta >= 0 ? 'add' : 'take');
        const entry = await allowanceService.addEntry({
          childId: selectedChild.id,
          amountDelta: suggestion.amountDelta,
          reason: suggestion.reason,
          source: 'manual',
        });
        setEntries((prev) => [entry, ...prev]);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Could not save entry.');
      } finally {
        setQuickLogging(false);
      }
    },
    [selectedChild, quickLogging],
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
        <Text style={styles.emptySubtitle}>Add a child to start tracking allowance.</Text>
        <PrimaryButton label="Go to Household" onPress={() => navigation.navigate('KidsTab')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <BalanceCard
          childName={selectedChild.name}
          balance={balance}
          weeklyStartingAmount={selectedChild.weeklyStartingAmount}
        />

        {children.length > 1 ? (
          <ChildSelector
            children={children}
            selectedChildId={selectedChild.id}
            onSelect={handleSelectChild}
          />
        ) : null}

        <PrimaryButton
          label="Log an entry"
          onPress={() => navigation.navigate('Adjustment', { childId: selectedChild.id })}
        />

        {quickSuggestions.length > 0 ? (
          <>
            <Text style={styles.quickLogLabel}>Quick log</Text>
            <EntrySuggestionRow
              suggestions={quickSuggestions}
              onSelect={handleQuickLog}
              disabled={quickLogging}
            />
          </>
        ) : null}

        <PrimaryButton label="Start new week" variant="secondary" onPress={handleCloseWeek} />

        <Text style={styles.sectionTitle}>Entries</Text>
        <LedgerEntryList entries={currentWeekEntries} onDelete={handleDeleteEntry} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    ...typography.label,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  quickLogLabel: {
    ...typography.label,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.heading,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.caption,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
