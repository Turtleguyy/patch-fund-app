import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { Child } from '../models/Child';
import { allowanceService } from '../services/allowanceService';
import { formatMoney } from '../utils/formatMoney';
import { KidsStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<KidsStackParamList, 'ManageChildren'>;

export function ManageChildrenScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);

  const load = useCallback(async () => {
    const state = await allowanceService.loadAppState();
    setChildren(state.children);
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

  const handleRemove = useCallback(
    (child: Child) => {
      Alert.alert(
        `Remove ${child.name}?`,
        'Their allowance history will be deleted. This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await allowanceService.removeChild(child.id);
                setChildren(result.children);
              } catch (error) {
                Alert.alert(
                  'Error',
                  error instanceof Error ? error.message : 'Could not remove child.',
                );
              }
            },
          },
        ],
      );
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

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Tap a child to edit. Remove deletes their history.</Text>

      {children.length === 0 ? (
        <Text style={styles.empty}>No kids yet.</Text>
      ) : (
        <View style={styles.list}>
          {children.map((child) => (
            <View key={child.id} style={styles.row}>
              <Pressable
                style={styles.rowInfo}
                onPress={() => navigation.navigate('AddChild', { childId: child.id })}
              >
                <Text style={styles.name}>{child.name}</Text>
                <Text style={styles.allowance}>
                  {formatMoney(child.weeklyStartingAmount)} / week
                </Text>
              </Pressable>
              <Pressable style={styles.removeButton} onPress={() => handleRemove(child)}>
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <PrimaryButton label="Add a child" onPress={() => navigation.navigate('AddChild')} />
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
  subtitle: {
    ...typography.caption,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  empty: {
    ...typography.caption,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  list: {
    marginBottom: spacing.md,
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
  rowInfo: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  allowance: {
    ...typography.caption,
    fontSize: 15,
  },
  removeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  removeButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
});
