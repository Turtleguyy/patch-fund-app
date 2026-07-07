import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { FormField, formStyles } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Child } from '../models/Child';
import { allowanceService } from '../services/allowanceService';
import { profileService } from '../services/profileService';
import { formatMoney } from '../utils/formatMoney';
import { KidsStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme';
import { useCloudSync } from '../hooks/useCloudSync';

type Props = NativeStackScreenProps<KidsStackParamList, 'ManageChildren'>;

export function ManageChildrenScreen({ navigation }: Props) {
  const { household, isCloudEnabled, profile, refreshProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (profile?.displayName) {
      setDisplayName(profile.displayName);
    }
  }, [profile?.displayName]);

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

  useCloudSync(load);

  const handleSaveName = useCallback(async () => {
    if (!displayName.trim()) {
      Alert.alert('Add your name', 'Enter the name shown on entries you log.');
      return;
    }

    setSavingName(true);
    try {
      await profileService.updateDisplayName(displayName);
      await refreshProfile();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not save your name.');
    } finally {
      setSavingName(false);
    }
  }, [displayName, refreshProfile]);

  const handleShareInvite = useCallback(async () => {
    if (!household) return;
    await Share.share({
      message: `Join our Patch Fund household with invite code: ${household.inviteCode}`,
    });
  }, [household]);

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
      {isCloudEnabled && profile ? (
        <View style={styles.profileCard}>
          <FormField label="Your name">
            <TextInput
              style={formStyles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="e.g. Zach"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </FormField>
          <Text style={styles.profileHint}>Shown on entries you log.</Text>
          {displayName.trim() !== profile.displayName ? (
            <View style={styles.profileSaveWrap}>
              <PrimaryButton
                label={savingName ? 'Saving…' : 'Save name'}
                variant="secondary"
                onPress={handleSaveName}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {isCloudEnabled && household ? (
        <View style={styles.inviteCard}>
          <Text style={styles.inviteLabel}>Household invite code</Text>
          <Text style={styles.inviteCode}>{household.inviteCode}</Text>
          <View style={styles.inviteShareWrap}>
            <PrimaryButton label="Share invite code" variant="secondary" onPress={handleShareInvite} />
          </View>
        </View>
      ) : null}

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

      {isCloudEnabled ? (
        <PrimaryButton label="Sign out" variant="secondary" onPress={() => void signOut()} />
      ) : null}
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
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  profileHint: {
    ...typography.caption,
    fontSize: 14,
    marginTop: -spacing.xs,
  },
  profileSaveWrap: {
    marginTop: spacing.sm,
  },
  inviteCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  inviteLabel: {
    ...typography.caption,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  inviteCode: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 6,
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  inviteShareWrap: {
    alignSelf: 'stretch',
    width: '100%',
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
