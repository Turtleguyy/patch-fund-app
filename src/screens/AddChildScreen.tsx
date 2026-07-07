import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FormField, formStyles } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { allowanceService } from '../services/allowanceService';
import { KidsStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<KidsStackParamList, 'AddChild'>;

export function AddChildScreen({ route, navigation }: Props) {
  const childId = route.params?.childId;
  const isEditing = Boolean(childId);

  const [loading, setLoading] = useState(isEditing);
  const [name, setName] = useState('');
  const [weeklyAmountText, setWeeklyAmountText] = useState('10');
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit child' : 'Add a child' });
  }, [navigation, isEditing]);

  useFocusEffect(
    useCallback(() => {
      if (!childId) {
        setName('');
        setWeeklyAmountText('10');
        setLoading(false);
        return;
      }

      let active = true;
      (async () => {
        setLoading(true);
        const state = await allowanceService.loadAppState();
        const child = state.children.find((item) => item.id === childId);
        if (!active) return;

        if (!child) {
          Alert.alert('Error', 'Child not found.');
          navigation.goBack();
          return;
        }

        setName(child.name);
        setWeeklyAmountText(String(child.weeklyStartingAmount));
        setLoading(false);
      })();

      return () => {
        active = false;
      };
    }, [childId, navigation]),
  );

  const handleSave = useCallback(async () => {
    const weeklyStartingAmount = Number(weeklyAmountText);
    if (!name.trim()) {
      Alert.alert('Add a name', "What's your child's name?");
      return;
    }
    if (Number.isNaN(weeklyStartingAmount) || weeklyStartingAmount < 0) {
      Alert.alert('Check the amount', 'Enter a valid weekly allowance.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && childId) {
        await allowanceService.updateChild(childId, name.trim(), weeklyStartingAmount);
      } else {
        await allowanceService.addChild(name.trim(), weeklyStartingAmount);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : `Could not ${isEditing ? 'update' : 'add'} child.`,
      );
    } finally {
      setSaving(false);
    }
  }, [name, weeklyAmountText, navigation, isEditing, childId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{isEditing ? 'Edit child' : 'Add a child'}</Text>

        <FormField label="Name">
          <TextInput
            style={formStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="Daniel"
            autoCapitalize="words"
          />
        </FormField>

        <FormField label="Weekly allowance" hint="What they start each week with.">
          <View style={styles.amountWrap}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              style={[formStyles.input, styles.amountInput]}
              value={weeklyAmountText}
              onChangeText={setWeeklyAmountText}
              keyboardType="decimal-pad"
              inputMode="decimal"
              placeholder="10"
            />
          </View>
        </FormField>

        <View style={styles.actions}>
          <PrimaryButton label={saving ? 'Saving…' : 'Save'} onPress={handleSave} />
          <PrimaryButton label="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
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
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    ...typography.title,
    fontSize: 28,
    marginBottom: spacing.lg,
  },
  amountWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  currency: {
    position: 'absolute',
    left: spacing.md,
    fontSize: 20,
    fontWeight: '600',
    color: colors.textMuted,
    zIndex: 1,
  },
  amountInput: {
    paddingLeft: 36,
  },
  actions: {
    marginTop: spacing.sm,
  },
});
