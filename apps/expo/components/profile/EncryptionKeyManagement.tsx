import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authenticatedFetch } from '@countcard/api-client';
import { Button, StatusBadge } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

export type EncryptionKeyManagementVariant = 'summary' | 'full';

type KeyStatus =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'none' }
  | { state: 'active'; keyVersion: number };

async function loadKeyStatus(): Promise<KeyStatus> {
  try {
    const res = await authenticatedFetch('/api/encryption/key');
    if (res.status === 404) return { state: 'none' };
    if (res.status === 401) {
      return { state: 'error', message: 'Session expired. Sign in again to manage encryption.' };
    }
    const raw = await res.text();
    if (!res.ok) {
      let message = 'Could not load encryption status.';
      try {
        const err = JSON.parse(raw) as { error?: string };
        if (err.error) message = err.error;
      } catch {
        /* keep default */
      }
      return { state: 'error', message };
    }
    const data = JSON.parse(raw) as { keyVersion?: number };
    const keyVersion = typeof data.keyVersion === 'number' ? data.keyVersion : 1;
    return { state: 'active', keyVersion };
  } catch (e) {
    return {
      state: 'error',
      message: e instanceof Error ? e.message : 'Could not load encryption status.',
    };
  }
}

function parseApiError(raw: string): string {
  try {
    const j = JSON.parse(raw) as { error?: string };
    return j.error ?? 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export default function EncryptionKeyManagement({
  variant,
}: {
  variant: EncryptionKeyManagementVariant;
}) {
  const router = useRouter();
  const theme = useAppTheme();
  const [status, setStatus] = useState<KeyStatus>({ state: 'loading' });
  const [generating, setGenerating] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [recoveryGenerating, setRecoveryGenerating] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [recoveryCodeModal, setRecoveryCodeModal] = useState<{
    code: string;
    expiresAt: string;
  } | null>(null);
  const [rotateModalOpen, setRotateModalOpen] = useState(false);

  const refresh = useCallback(async () => {
    setStatus({ state: 'loading' });
    setStatus(await loadKeyStatus());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isFull = variant === 'full';

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await authenticatedFetch('/api/encryption/generate-key', { method: 'POST' });
      const raw = await res.text();
      if (!res.ok) {
        Alert.alert('Error', parseApiError(raw));
        return;
      }
      const data = JSON.parse(raw) as { keyVersion?: number };
      Alert.alert('Success', 'Encryption key created.');
      setStatus({
        state: 'active',
        keyVersion: typeof data.keyVersion === 'number' ? data.keyVersion : 1,
      });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to create encryption key.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateRecoveryCode() {
    setRecoveryGenerating(true);
    try {
      const res = await authenticatedFetch('/api/encryption/recovery-code', { method: 'POST' });
      const raw = await res.text();
      if (!res.ok) {
        Alert.alert('Error', parseApiError(raw));
        return;
      }
      const data = JSON.parse(raw) as { recoveryCode?: string; expiresAt?: string };
      if (!data.recoveryCode) {
        Alert.alert('Error', 'Unexpected response from server.');
        return;
      }
      const expiresAt =
        typeof data.expiresAt === 'string'
          ? data.expiresAt
          : new Date().toISOString();
      setRecoveryCodeModal({ code: data.recoveryCode, expiresAt });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to generate recovery code.');
    } finally {
      setRecoveryGenerating(false);
    }
  }

  async function handleRotate() {
    setRotating(true);
    try {
      const res = await authenticatedFetch('/api/encryption/rotate-key', { method: 'POST' });
      const raw = await res.text();
      if (!res.ok) {
        Alert.alert('Error', parseApiError(raw));
        return;
      }
      const data = JSON.parse(raw) as { keyVersion?: number };
      setRotateModalOpen(false);
      setStatus({
        state: 'active',
        keyVersion: typeof data.keyVersion === 'number' ? data.keyVersion : 1,
      });
      Alert.alert('Rotated', 'Encryption key rotated. Existing encrypted data may need re-encryption.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to rotate key.');
    } finally {
      setRotating(false);
    }
  }

  async function handleRecover() {
    const trimmed = recoveryCodeInput.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Enter your recovery code.');
      return;
    }
    setRecovering(true);
    try {
      const res = await authenticatedFetch('/api/encryption/recover-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryCode: trimmed }),
      });
      const raw = await res.text();
      if (!res.ok) {
        Alert.alert('Error', parseApiError(raw));
        return;
      }
      setRecoveryCodeInput('');
      await refresh();
      Alert.alert('Success', 'Recovery code accepted.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Recovery failed.');
    } finally {
      setRecovering(false);
    }
  }

  function copyRecoveryCode() {
    Alert.alert('Recovery code', 'Long-press the code below to copy.');
  }

  return (
    <>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {isFull ? 'Key status' : 'Data encryption'}
        </Text>
        <Text style={[styles.body, { color: theme.colors.textMuted }]}>
          {isFull
            ? 'Your account encryption key powers recruit notes, emergency contacts, and direct messages when all participants have keys.'
            : 'End-to-end encryption for supported data. Open the backup page for recovery codes and key rotation.'}
        </Text>

        {status.state === 'loading' ? (
          <Text style={{ color: theme.colors.textMuted }}>Checking status…</Text>
        ) : null}
        {status.state === 'error' ? (
          <View style={styles.gap}>
            <Text style={{ color: theme.colors.error }}>{status.message}</Text>
            <Button title="Try again" variant="secondary" onPress={() => void refresh()} />
          </View>
        ) : null}
        {status.state === 'none' ? (
          <Text style={{ color: theme.colors.text }}>
            No encryption key yet. Create one to enable end-to-end encryption for supported data.
          </Text>
        ) : null}
        {status.state === 'active' ? (
          <View style={styles.badgeRow}>
            <StatusBadge label={`Active (v${status.keyVersion})`} tone="success" />
          </View>
        ) : null}

        <View style={styles.actions}>
          {status.state === 'none' ? (
            <Button title="Create encryption key" onPress={() => void handleGenerate()} loading={generating} />
          ) : null}
          {isFull ? (
            <>
              <Button title="Back to profile" variant="secondary" onPress={() => router.push('/profile')} />
              <Button title="Refresh status" variant="secondary" onPress={() => void refresh()} />
            </>
          ) : (
            <Button
              title="Encryption & backup"
              variant="secondary"
              onPress={() => router.push('/profile/encryption')}
            />
          )}
        </View>

        {isFull && status.state === 'active' ? (
          <View style={styles.fullSection}>
            <Text style={[styles.subtitle, { color: theme.colors.text }]}>Recovery code</Text>
            <Text style={[styles.body, { color: theme.colors.textMuted }]}>
              Generate a recovery code and store it offline. Save it immediately — the server does not show it again.
            </Text>
            <Button
              title="Generate new recovery code"
              variant="secondary"
              onPress={() => void handleGenerateRecoveryCode()}
              loading={recoveryGenerating}
            />

            <Text style={[styles.subtitle, { color: theme.colors.text, marginTop: spacing.lg }]}>
              Use a recovery code
            </Text>
            <TextInput
              value={recoveryCodeInput}
              onChangeText={setRecoveryCodeInput}
              placeholder="Paste your recovery code"
              multiline
              style={[
                styles.textarea,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                },
              ]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button
              title="Submit recovery code"
              variant="secondary"
              onPress={() => void handleRecover()}
              loading={recovering}
            />

            <Text style={[styles.subtitle, { color: theme.colors.text, marginTop: spacing.lg }]}>
              Rotate encryption key
            </Text>
            <Text style={[styles.body, { color: theme.colors.textMuted }]}>
              Creates a new key version. Only rotate if you understand the impact on existing ciphertext.
            </Text>
            <Button title="Rotate key…" variant="secondary" onPress={() => setRotateModalOpen(true)} />
          </View>
        ) : null}
      </View>

      <Modal visible={Boolean(recoveryCodeModal)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
            <ScrollView>
              <Text style={[styles.title, { color: theme.colors.text }]}>Save your recovery code</Text>
              <Text style={[styles.body, { color: theme.colors.textMuted }]}>
                Store this code in a safe place. It expires on{' '}
                {recoveryCodeModal ? new Date(recoveryCodeModal.expiresAt).toLocaleString() : ''}.
              </Text>
              <Text style={[styles.codeBox, { color: theme.colors.text }]} selectable>
                {recoveryCodeModal?.code}
              </Text>
              <View style={styles.modalActions}>
                <Button title="Copy code" variant="secondary" onPress={() => void copyRecoveryCode()} />
                <Button title="Done" onPress={() => setRecoveryCodeModal(null)} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={rotateModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Rotate encryption key?</Text>
            <Text style={[styles.body, { color: theme.colors.textMuted }]}>
              This creates a new key version. Encrypted data from the previous key may not open until migrated.
            </Text>
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="secondary" onPress={() => setRotateModalOpen(false)} />
              <Button title="Rotate key" onPress={() => void handleRotate()} loading={rotating} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.base, gap: 12 },
  title: { ...typography.headline },
  subtitle: { ...typography.subtitle, fontWeight: '600' },
  body: { ...typography.body, lineHeight: 22 },
  badgeRow: { marginTop: 4 },
  actions: { gap: 10, marginTop: spacing.sm },
  fullSection: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  gap: { gap: 10 },
  textarea: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: { borderRadius: radius.lg, padding: spacing.xl, maxHeight: '80%' },
  modalActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.lg, justifyContent: 'flex-end' },
  codeBox: {
    fontFamily: 'monospace',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: spacing.md,
  },
});
