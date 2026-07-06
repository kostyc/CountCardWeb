import { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import type { OrganizationalAssignment, Regiment } from '@countcard/core/types/auth';
import type { Battalion, Company, Series } from '@countcard/core/validation/organizationSchemas';
import {
  createTransferBatch,
  listTransferBatches,
} from '@countcard/firebase/services/transferBatches';
import { listRecruits } from '@countcard/firebase/services/recruits';
import { validateOrganizationalAssignment } from '@countcard/firebase/services/organizations';
import type { TransferBatch } from '@countcard/core/types/models';
import type { RecruitProfile } from '@countcard/core/types/models';
import { canPerformReceivingWorkflow } from '@countcard/core/permissions/adminAccess';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, SectionHeader, Button, ListRow, EmptyState, Input, Select } from '@/components/ui';
import {
  REGIMENT_OPTIONS,
  BATTALIONS,
  BATTALION_COMPANIES,
  SERIES,
} from '@/constants/profileOptions';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography, radius, cardShadow } from '@/constants/theme';

export default function ReceivingTransfersScreen() {
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const theme = useAppTheme();
  const router = useRouter();
  const [batches, setBatches] = useState<TransferBatch[]>([]);
  const [readyRecruits, setReadyRecruits] = useState<RecruitProfile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pickupWeek, setPickupWeek] = useState('');
  const [regiment, setRegiment] = useState<Regiment | ''>('West');
  const [battalion, setBattalion] = useState<Battalion | ''>('');
  const [company, setCompany] = useState<Company | ''>('');
  const [series, setSeries] = useState<Series | ''>('');
  const [platoon, setPlatoon] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canAccess = canPerformReceivingWorkflow(appUser);

  const companyOptions = battalion
    ? (BATTALION_COMPANIES[battalion] ?? []).map((c) => ({ value: c, label: c }))
    : [];

  const destination = useMemo<OrganizationalAssignment>(
    () => ({
      regiment: regiment || undefined,
      battalion: battalion || undefined,
      company: company || undefined,
      series: series || undefined,
      platoon: platoon.trim() || undefined,
    }),
    [regiment, battalion, company, series, platoon]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [batchResult, recruitResult] = await Promise.all([
        listTransferBatches(undefined, { pageSize: 50 }),
        listRecruits({ custodyPhase: 'receiving_ready' }, { pageSize: 100 }),
      ]);
      setBatches(batchResult.items);
      setReadyRecruits(recruitResult.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load receiving data');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  function toggleRecruit(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreateBatch() {
    if (!user || selected.size === 0) return;
    if (!platoon.trim()) {
      setError('Destination platoon is required');
      return;
    }
    if (battalion && company) {
      const orgValidation = validateOrganizationalAssignment(destination);
      if (!orgValidation.valid) {
        setError(orgValidation.error ?? 'Invalid destination assignment');
        return;
      }
    }

    setCreating(true);
    setError(null);
    setMessage(null);
    try {
      const batchId = `tb-${Date.now()}`;
      await createTransferBatch(batchId, {
        pickupWeek: pickupWeek.trim() || `Week-${new Date().toISOString().slice(0, 10)}`,
        regiment: destination.regiment ?? 'West',
        destinationAssignment: destination,
        recruitIds: Array.from(selected),
        createdBy: user.uid,
      });
      setSelected(new Set());
      setPickupWeek('');
      setMessage('Draft batch created.');
      router.push(`/receiving/transfers/${batchId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create transfer batch');
    } finally {
      setCreating(false);
    }
  }

  if (!canAccess) {
    return (
      <Screen scroll>
        <EmptyState
          title="Receiving access required"
          description="Your account must be assigned to Support Battalion / Receiving Company."
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionHeader
        title="Receiving transfers"
        subtitle="Create custody batches and publish rosters"
      />

      <View style={styles.intakeActions}>
        <Button title="Add recruit (intake)" variant="secondary" onPress={() => router.push('/receiving/intake')} />
        <Button title="Import roster" variant="secondary" onPress={() => router.push('/receiving/import')} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : null}

      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
      {message ? <Text style={[styles.message, { color: theme.colors.primary }]}>{message}</Text> : null}

      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Create transfer batch</Text>
        <Input
          label="Pickup week"
          value={pickupWeek}
          onChangeText={setPickupWeek}
          placeholder="e.g. Week-2026-07-11"
        />
        <Select label="Regiment" value={regiment} onChange={setRegiment} options={REGIMENT_OPTIONS} placeholder="Select regiment" />
        <Select
          label="Battalion"
          value={battalion}
          onChange={(v) => {
            setBattalion(v);
            setCompany('');
          }}
          options={BATTALIONS.map((b) => ({ value: b, label: b }))}
          placeholder="Select battalion"
        />
        <Select label="Company" value={company} onChange={setCompany} options={companyOptions} placeholder="Select company" />
        <Select label="Series" value={series} onChange={setSeries} options={SERIES.map((s) => ({ value: s, label: s }))} placeholder="Select series" />
        <Input label="Destination platoon (4 digits)" value={platoon} onChangeText={setPlatoon} keyboardType="number-pad" maxLength={4} />

        <Text style={[styles.cardTitle, { color: theme.colors.text, marginTop: spacing.sm }]}>
          Ready recruits ({selected.size} selected)
        </Text>
        {readyRecruits.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted }}>No recruits marked receiving-ready.</Text>
        ) : (
          readyRecruits.map((r) => {
            const checked = selected.has(r.recruitId);
            return (
              <Pressable
                key={r.recruitId}
                onPress={() => toggleRecruit(r.recruitId)}
                style={({ pressed }) => [
                  styles.recruitRow,
                  {
                    backgroundColor: checked ? theme.colors.primaryMuted : 'transparent',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
              >
                <Text style={[styles.checkbox, { color: theme.colors.primary }]}>{checked ? '☑' : '☐'}</Text>
                <View style={styles.recruitInfo}>
                  <Text style={[styles.recruitName, { color: theme.colors.text }]}>
                    {r.lastName}, {r.firstName}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, ...typography.caption }}>
                    {r.edipi ?? r.recruitId}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}

        <Button
          title="Create draft batch"
          onPress={() => void handleCreateBatch()}
          loading={creating}
          disabled={selected.size === 0 || !platoon.trim()}
        />
      </View>

      <SectionHeader title="Transfer batches" />
      {batches.length === 0 && !loading ? (
        <EmptyState title="No batches" description="Draft transfer batches will appear here." />
      ) : (
        batches.map((b) => (
          <ListRow
            key={b.transferBatchId}
            title={`${b.pickupWeek} — ${b.status}`}
            subtitle={`${b.recruitIds.length} recruits → ${b.destinationAssignment.company ?? '—'} / ${b.destinationAssignment.platoon ?? '—'}`}
            onPress={() => router.push(`/receiving/transfers/${b.transferBatchId}`)}
          />
        ))
      )}

      <View style={styles.footer}>
        <Button title="Refresh" variant="secondary" onPress={() => void load()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intakeActions: { gap: 10, marginBottom: spacing.base },
  loader: { marginVertical: spacing.lg },
  error: { ...typography.body, marginBottom: spacing.base },
  message: { ...typography.body, marginBottom: spacing.base },
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.base,
    gap: 12,
  },
  cardTitle: { ...typography.subtitle, fontWeight: '600' },
  recruitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  checkbox: { fontSize: 22, width: 28, textAlign: 'center' },
  recruitInfo: { flex: 1 },
  recruitName: { ...typography.body, fontWeight: '500' },
  footer: { marginTop: spacing.lg, marginBottom: spacing.xl },
});
