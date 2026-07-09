import { SiriAuthorizationStatus } from 'allowance-intents';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { colors, radii, spacing, typography } from '../theme';

export type SiriSetupMode = 'brief' | 'guide';

interface SiriSetupModalProps {
  visible: boolean;
  mode: SiriSetupMode;
  status: SiriAuthorizationStatus;
  onDismiss: () => void;
  onDismissPermanently: () => void;
  onEnableSiri: () => Promise<void>;
  onOpenSettings: () => void;
}

function Step({ number, children }: { number: number; children: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepNumber}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{children}</Text>
    </View>
  );
}

function ExamplePhrases() {
  return (
    <View style={styles.examples}>
      <Text style={styles.example}>"add five dollars for mowing the lawn"</Text>
      <Text style={styles.example}>"take two dollars from Harper for talking back"</Text>
    </View>
  );
}

export function SiriSetupModal({
  visible,
  mode,
  status,
  onDismiss,
  onDismissPermanently,
  onEnableSiri,
  onOpenSettings,
}: SiriSetupModalProps) {
  const needsSiriPermission = status === 'notDetermined';
  const siriBlocked = status === 'denied' || status === 'restricted';
  const readyForPhrase = !needsSiriPermission && !siriBlocked;
  const isBrief = mode === 'brief';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.content} bounces={false}>
            <Text style={styles.title}>Log with Siri</Text>

            {needsSiriPermission ? (
              <>
                <Text style={styles.body}>
                  Log allowance by voice — add or take money, pick a child, and say why.
                </Text>
                <PrimaryButton label="Enable Siri" onPress={onEnableSiri} />
              </>
            ) : null}

            {siriBlocked ? (
              <>
                <Text style={styles.body}>
                  Siri is turned off for Patch Fund. Open Settings, allow Siri, then turn on the
                  Patch Fund toggles under Apps.
                </Text>
                <PrimaryButton label="Open Settings" onPress={onOpenSettings} />
              </>
            ) : null}

            {readyForPhrase && isBrief ? (
              <>
                <Text style={styles.body}>
                  You're set. Say <Text style={styles.emphasis}>"Hey Siri, Patch Fund"</Text>, then
                  say what to log.
                </Text>
                <ExamplePhrases />
              </>
            ) : null}

            {readyForPhrase && !isBrief ? (
              <>
                <Text style={styles.body}>
                  Say <Text style={styles.emphasis}>"Hey Siri, Patch Fund"</Text>, then tell Siri
                  what to log.
                </Text>
                <ExamplePhrases />
                <View style={styles.steps}>
                  <Step number={1}>
                    Open Settings → Apple Intelligence & Siri → Apps → Patch Fund
                  </Step>
                  <Step number={2}>
                    Turn on Learn from this App and the Suggestions toggles
                  </Step>
                  <Step number={3}>
                    In Shortcuts, tap + and search "Log Entry" or "Patch Fund"
                  </Step>
                  <Step number={4}>Try "Hey Siri, what can I do with Patch Fund?"</Step>
                </View>
              </>
            ) : null}

            <PrimaryButton label="Got it" variant="secondary" onPress={onDismiss} />
            {isBrief ? (
              <Pressable onPress={onDismissPermanently} style={styles.dismissLink}>
                <Text style={styles.dismissText}>Don't show again</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    ...typography.title,
    fontSize: 26,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    fontSize: 17,
    lineHeight: 24,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  emphasis: {
    fontWeight: '700',
    color: colors.text,
  },
  examples: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
  },
  example: {
    ...typography.caption,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
    textAlign: 'center',
    color: colors.text,
  },
  steps: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumber: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    ...typography.body,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'left',
  },
  dismissLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dismissText: {
    ...typography.caption,
    fontSize: 15,
    color: colors.textMuted,
  },
});
