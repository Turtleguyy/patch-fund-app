import { Ionicons } from '@expo/vector-icons';
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
import { PrimaryButton } from '../components/PrimaryButton';
import { SectionCard, SettingsRow } from '../components/SettingsRow';
import { Child } from '../models/Child';
import { allowanceService } from '../services/allowanceService';
import { profileService } from '../services/profileService';
import { formatMoney } from '../utils/formatMoney';
import { KidsStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme';
import { useCloudSync } from '../hooks/useCloudSync';

type Props = NativeStackScreenProps<KidsStackParamList, 'ManageChildren'>;

function childInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

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

  const handleRemove = useCallback((child: Child) => {
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
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Household</Text>
      <Text style={styles.pageSubtitle}>Manage your family, sharing, and voice logging.</Text>

      {isCloudEnabled && profile ? (
        <SectionCard title="You">
          <View style={styles.profileBody}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{childInitial(displayName || profile.displayName)}</Text>
              </View>
              <View style={styles.profileCopy}>
                <Text style={styles.profileLabel}>Your name</Text>
                <Text style={styles.profileHint}>Shown on entries you log</Text>
              </View>
            </View>
            <TextInput
              style={styles.nameInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="e.g. Zach"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {displayName.trim() !== profile.displayName ? (
              <PrimaryButton
                label={savingName ? 'Saving…' : 'Save name'}
                variant="secondary"
                onPress={handleSaveName}
              />
            ) : null}
          </View>
        </SectionCard>
      ) : null}

      {isCloudEnabled && household ? (
        <SectionCard title="Sharing">
          <View style={styles.inviteBody}>
            <Text style={styles.inviteLabel}>Invite code</Text>
            <Text style={styles.inviteCode}>{household.inviteCode}</Text>
            <Text style={styles.inviteHint}>Share this with the other parent to join your household.</Text>
            <PrimaryButton label="Share invite code" variant="secondary" onPress={handleShareInvite} />
          </View>
        </SectionCard>
      ) : null}

      <SectionCard title={`Kids${children.length > 0 ? ` (${children.length})` : ''}`}>
        {children.length === 0 ? (
          <View style={styles.emptyKids}>
            <Text style={styles.emptyKidsText}>No kids yet. Add one to start tracking allowance.</Text>
          </View>
        ) : (
          children.map((child, index) => (
            <View key={child.id} style={[styles.childRow, index < children.length - 1 && styles.childRowDivider]}>
              <Pressable
                style={({ pressed }) => [styles.childMain, pressed && styles.childMainPressed]}
                onPress={() => navigation.navigate('AddChild', { childId: child.id })}
              >
                <View style={styles.childAvatar}>
                  <Text style={styles.childAvatarText}>{childInitial(child.name)}</Text>
                </View>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childAllowance}>
                    {formatMoney(child.weeklyStartingAmount)} / week
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
              <Pressable style={styles.removeButton} onPress={() => handleRemove(child)}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </View>
          ))
        )}
      </SectionCard>

      <PrimaryButton label="Add a child" onPress={() => navigation.navigate('AddChild')} />

      {isCloudEnabled ? (
        <SectionCard>
          <SettingsRow
            icon="log-out-outline"
            title="Sign out"
            subtitle="Leave this household on this device"
            onPress={() => void signOut()}
            destructive
            isLast
          />
        </SectionCard>
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
  pageTitle: {
    ...typography.title,
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  pageSubtitle: {
    ...typography.caption,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  profileBody: {
    padding: spacing.md,
    gap: spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
  },
  profileLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  profileHint: {
    ...typography.caption,
    fontSize: 14,
  },
  nameInput: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 17,
    color: colors.text,
  },
  inviteBody: {
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  inviteLabel: {
    ...typography.label,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inviteCode: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 6,
    color: colors.accent,
  },
  inviteHint: {
    ...typography.caption,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptyKids: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyKidsText: {
    ...typography.caption,
    fontSize: 16,
    textAlign: 'center',
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  childMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  childMainPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childAvatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  childInfo: {
    flex: 1,
    gap: 2,
  },
  childName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  childAllowance: {
    ...typography.caption,
    fontSize: 14,
  },
  removeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
});
