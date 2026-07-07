import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { FormField, formStyles } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { AuthStackParamList } from '../navigation/types';
import { profileService } from '../services/profileService';
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'SetDisplayName'>;

export function SetDisplayNameScreen(_props: Props) {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.displayName === 'Parent' ? '' : (profile?.displayName ?? ''));
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Add your name', 'This is how entries will show who logged them.');
      return;
    }

    setSaving(true);
    try {
      await profileService.updateDisplayName(name);
      await refreshProfile();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not save your name.');
    } finally {
      setSaving(false);
    }
  }, [name, refreshProfile]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>What should we call you?</Text>
        <Text style={styles.subtitle}>
          Entries you log will show your name so the other parent knows who added them.
        </Text>

        <FormField label="Your name">
          <TextInput
            style={formStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Zach"
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus
          />
        </FormField>

        <PrimaryButton label={saving ? 'Saving…' : 'Continue'} onPress={handleSave} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
});
