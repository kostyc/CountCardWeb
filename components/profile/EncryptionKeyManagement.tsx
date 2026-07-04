'use client';

/**
 * Profile encryption key status and actions (Sprint 13 Task 2).
 * Uses GET/POST /api/encryption/* — never surfaces raw key material in the UI.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { authenticatedFetch } from '@/lib/api/clientAuth';
import { useToast } from '@/context/ToastContext';
import { debugLog } from '@/lib/utils/debugLogger';

export type EncryptionKeyManagementVariant = 'summary' | 'full';

type KeyStatus =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'none' }
  | { state: 'active'; keyVersion: number };

async function loadKeyStatus(): Promise<KeyStatus> {
  try {
    const res = await authenticatedFetch('/api/encryption/key');
    if (res.status === 404) {
      return { state: 'none' };
    }
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
    debugLog.warn('Encryption key status request failed', 'EncryptionKeyManagement', {
      isError: e instanceof Error,
    });
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
}): JSX.Element {
  const router = useRouter();
  const { showToast } = useToast();
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

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await authenticatedFetch('/api/encryption/generate-key', { method: 'POST' });
      const raw = await res.text();
      if (!res.ok) {
        showToast({ variant: 'error', message: parseApiError(raw) });
        return;
      }
      const data = JSON.parse(raw) as { keyVersion?: number };
      showToast({
        variant: 'success',
        message: 'Encryption key created. You can add a recovery code from this page.',
      });
      setStatus({
        state: 'active',
        keyVersion: typeof data.keyVersion === 'number' ? data.keyVersion : 1,
      });
    } catch (e) {
      showToast({
        variant: 'error',
        message: e instanceof Error ? e.message : 'Failed to create encryption key.',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateRecoveryCode = async () => {
    setRecoveryGenerating(true);
    try {
      const res = await authenticatedFetch('/api/encryption/recovery-code', { method: 'POST' });
      const raw = await res.text();
      if (!res.ok) {
        showToast({ variant: 'error', message: parseApiError(raw) });
        return;
      }
      const data = JSON.parse(raw) as { recoveryCode?: string; expiresAt?: string };
      if (!data.recoveryCode) {
        showToast({ variant: 'error', message: 'Unexpected response from server.' });
        return;
      }
      const expiresAt =
        typeof data.expiresAt === 'string'
          ? data.expiresAt
          : data.expiresAt != null
            ? new Date(data.expiresAt as string | number | Date).toISOString()
            : new Date().toISOString();
      setRecoveryCodeModal({ code: data.recoveryCode, expiresAt });
    } catch (e) {
      showToast({
        variant: 'error',
        message: e instanceof Error ? e.message : 'Failed to generate recovery code.',
      });
    } finally {
      setRecoveryGenerating(false);
    }
  };

  const handleRotate = async () => {
    setRotating(true);
    try {
      const res = await authenticatedFetch('/api/encryption/rotate-key', { method: 'POST' });
      const raw = await res.text();
      if (!res.ok) {
        showToast({ variant: 'error', message: parseApiError(raw) });
        return;
      }
      const data = JSON.parse(raw) as { keyVersion?: number; note?: string };
      const keyVersion = typeof data.keyVersion === 'number' ? data.keyVersion : 1;
      setRotateModalOpen(false);
      setStatus({ state: 'active', keyVersion });
      showToast({
        variant: 'success',
        message: 'Encryption key rotated. Existing encrypted data may need re-encryption before it opens correctly.',
      });
    } catch (e) {
      showToast({
        variant: 'error',
        message: e instanceof Error ? e.message : 'Failed to rotate key.',
      });
    } finally {
      setRotating(false);
    }
  };

  const handleRecover = async () => {
    const trimmed = recoveryCodeInput.trim();
    if (!trimmed) {
      showToast({ variant: 'error', message: 'Enter your recovery code.' });
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
        showToast({ variant: 'error', message: parseApiError(raw) });
        return;
      }
      setRecoveryCodeInput('');
      await refresh();
      showToast({
        variant: 'success',
        message: 'Recovery code accepted. That code cannot be used again.',
      });
    } catch (e) {
      showToast({
        variant: 'error',
        message: e instanceof Error ? e.message : 'Recovery failed.',
      });
    } finally {
      setRecovering(false);
    }
  };

  const copyRecoveryCode = async () => {
    if (!recoveryCodeModal) return;
    try {
      await navigator.clipboard.writeText(recoveryCodeModal.code);
      showToast({ variant: 'success', message: 'Recovery code copied to clipboard.' });
    } catch {
      showToast({ variant: 'error', message: 'Could not copy. Copy the code manually.' });
    }
  };

  const statusLine = () => {
    if (status.state === 'loading') {
      return <p className="text-text-secondary-light dark:text-text-secondary-dark">Checking status…</p>;
    }
    if (status.state === 'error') {
      return (
        <div className="space-y-2">
          <p className="text-marine-red dark:text-red-400">{status.message}</p>
          <Button type="button" variant="secondary" className="min-h-[44px]" onClick={() => void refresh()}>
            Try again
          </Button>
        </div>
      );
    }
    if (status.state === 'none') {
      return (
        <p className="text-text-primary-light dark:text-text-primary-dark">
          No encryption key yet. Sensitive recruit notes, emergency contacts, and direct messages can only use
          end-to-end encryption after you create a key.
        </p>
      );
    }
    return (
      <p className="text-text-primary-light dark:text-text-primary-dark">
        Your encryption key is <span className="font-semibold text-green-700 dark:text-green-400">active</span>
        {' '}(version {status.keyVersion}). The raw key is never shown here; the app loads it securely when needed.
      </p>
    );
  };

  const isFull = variant === 'full';

  return (
    <>
      <Card elevation="base" padding="lg">
        <Card.Header>
          <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark">
            {isFull ? 'Key status' : 'Data encryption'}
          </h2>
          <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {isFull
              ? 'Your account encryption key powers recruit notes, emergency contacts, and direct messages when all participants have keys.'
              : 'End-to-end encryption for supported data. Open the backup page for recovery codes and key rotation.'}
          </p>
        </Card.Header>
        <Card.Body className="space-y-4">
          {statusLine()}

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            {status.state === 'none' && (
              <Button
                type="button"
                variant="primary"
                className="min-h-[44px] w-full sm:w-auto"
                onClick={() => void handleGenerate()}
                disabled={generating}
                loading={generating}
              >
                Create encryption key
              </Button>
            )}
            {isFull ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-[44px] w-full sm:w-auto"
                  onClick={() => router.push('/profile')}
                >
                  Back to profile
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-[44px] w-full sm:w-auto"
                  onClick={() => void refresh()}
                  disabled={status.state === 'loading'}
                >
                  Refresh status
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="secondary"
                className="min-h-[44px] w-full sm:w-auto"
                onClick={() => router.push('/profile/encryption')}
              >
                Encryption & backup
              </Button>
            )}
          </div>

          {isFull && status.state === 'active' && (
            <div className="pt-4 border-t border-border-primary-light dark:border-border-primary-dark space-y-6">
              <div>
                <h3 className="text-base font-semibold text-text-heading-light dark:text-text-heading-dark mb-2">
                  Recovery code
                </h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3">
                  Generate a one-time-style recovery code and store it offline. Each generation adds a new code; save
                  it immediately — the server does not show it again.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-[44px]"
                  onClick={() => void handleGenerateRecoveryCode()}
                  disabled={recoveryGenerating}
                  loading={recoveryGenerating}
                >
                  Generate new recovery code
                </Button>
              </div>

              <div>
                <h3 className="text-base font-semibold text-text-heading-light dark:text-text-heading-dark mb-2">
                  Use a recovery code
                </h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3">
                  If you have a saved code, submit it here to confirm access. The code will be marked as used.
                </p>
                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  Recovery code
                </label>
                <textarea
                  value={recoveryCodeInput}
                  onChange={(e) => setRecoveryCodeInput(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border-primary-light dark:border-border-primary-dark bg-background-primary-light dark:bg-background-primary-dark px-3 py-2 text-text-primary-light dark:text-text-primary-dark min-h-[44px]"
                  placeholder="Paste your recovery code"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3 min-h-[44px]"
                  onClick={() => void handleRecover()}
                  disabled={recovering}
                  loading={recovering}
                >
                  Submit recovery code
                </Button>
              </div>

              <div>
                <h3 className="text-base font-semibold text-text-heading-light dark:text-text-heading-dark mb-2">
                  Rotate encryption key
                </h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3">
                  Creates a new key version. Existing ciphertext may not decrypt until data is re-encrypted (planned
                  follow-up). Only rotate if you understand the impact.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-[44px] text-marine-red border-marine-red/40"
                  onClick={() => setRotateModalOpen(true)}
                >
                  Rotate key…
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {recoveryCodeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recovery-code-title"
        >
          <div className="bg-background-primary-light dark:bg-background-primary-dark rounded-xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3
              id="recovery-code-title"
              className="text-lg font-semibold text-text-heading-light dark:text-text-heading-dark mb-2"
            >
              Save your recovery code
            </h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
              Store this code in a safe place. It expires on{' '}
              <time dateTime={recoveryCodeModal.expiresAt}>
                {new Date(recoveryCodeModal.expiresAt).toLocaleString()}
              </time>
              .
            </p>
            <div className="rounded-lg border border-border-primary-light dark:border-border-primary-dark bg-background-secondary-light dark:bg-background-secondary-dark p-3 font-mono text-sm break-all select-all mb-4">
              {recoveryCodeModal.code}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button type="button" variant="secondary" className="min-h-[44px]" onClick={() => void copyRecoveryCode()}>
                Copy code
              </Button>
              <Button type="button" variant="primary" className="min-h-[44px]" onClick={() => setRecoveryCodeModal(null)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {rotateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rotate-key-title"
        >
          <div className="bg-background-primary-light dark:bg-background-primary-dark rounded-xl shadow-xl p-6 max-w-lg w-full">
            <h3
              id="rotate-key-title"
              className="text-lg font-semibold text-text-heading-light dark:text-text-heading-dark mb-2"
            >
              Rotate encryption key?
            </h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
              This creates a new key version. Encrypted notes, contacts, and messages created with the previous key may
              not open until they are migrated. Confirm only if you intend to rotate.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                className="min-h-[44px]"
                onClick={() => setRotateModalOpen(false)}
                disabled={rotating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                className="min-h-[44px] bg-marine-red hover:opacity-90"
                onClick={() => void handleRotate()}
                disabled={rotating}
                loading={rotating}
              >
                Rotate key
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
