import { useCallback, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { getRecruitProfileById } from '@countcard/firebase/services/recruits';
import type { RecruitProfile } from '@countcard/core/types/models';
import { formatEdipiForDisplay } from '@countcard/core/utils/recruitEdipi';
import { canEditRecruit, canSeeFullRecruitProfile } from '@countcard/core/permissions/recruits';
import { canPerformReceivingWorkflow } from '@countcard/core/permissions/adminAccess';
import { CUSTODY_PHASE_METADATA, isTrainingCustodyPhase } from '@countcard/core/constants/custodyPhase';
import { RecruitProgressSection } from '@/components/recruits/RecruitProgressSection';
import { RecruitWeightSection } from '@/components/recruits/RecruitWeightSection';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, StatusBadge, SectionHeader, Button } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

function DetailField({ label, value }: { label: string; value?: string | null }) {
  const theme = useAppTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: theme.colors.text }]}>{value ?? '—'}</Text>
    </View>
  );
}

function formatIntendedAssignment(recruit: RecruitProfile): string | undefined {
  const a = recruit.intendedAssignment;
  if (!a) return undefined;
  const parts = [a.regiment, a.battalion, a.company, a.series, a.platoon].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : undefined;
}

export default function RecruitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const theme = useAppTheme();
  const [recruit, setRecruit] = useState<RecruitProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const canModify = useMemo(() => {
    if (!appUser || !recruit) return false;
    return canEditRecruit(appUser, recruit).allowed;
  }, [appUser, recruit]);

  const showReceivingChecklist = useMemo(() => {
    if (!appUser || !recruit) return false;
    if (!canPerformReceivingWorkflow(appUser)) return false;
    return recruit.custodyPhase === 'receiving' || recruit.custodyPhase === 'receiving_ready';
  }, [appUser, recruit]);

  const canTransfer = useMemo(() => {
    if (!canModify || !recruit) return false;
    return recruit.custodyPhase == null || isTrainingCustodyPhase(recruit.custodyPhase);
  }, [canModify, recruit]);

  const canSeeExtended = useMemo(() => {
    if (!appUser || !recruit) return false;
    return canSeeFullRecruitProfile(appUser, recruit);
  }, [appUser, recruit]);

  const hasExtendedInfo = useMemo(() => {
    if (!recruit) return false;
    return Boolean(
      recruit.medicalNotes ||
        recruit.dietaryRestrictions ||
        recruit.preferredContactMethod ||
        recruit.extendedNotes
    );
  }, [recruit]);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      getRecruitProfileById(id)
        .then((data) => setRecruit(data))
        .finally(() => setLoading(false));
    }, [id])
  );

  if (loading) {
    return (
      <Screen padded={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!recruit) {
    return (
      <Screen scroll>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 }}>
          Recruit not found
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={[styles.headerCard, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {recruit.rank} {recruit.lastName}, {recruit.firstName}
        </Text>
        <StatusBadge label={recruit.status ?? 'Unknown'} />
      </View>

      {canModify ? (
        <View style={styles.actions}>
          <Button title="Modify Recruit" onPress={() => router.push(`/recruits/${id}/edit`)} />
          {canTransfer ? (
            <Button title="Transfer Recruit" variant="secondary" onPress={() => router.push(`/recruits/${id}/transfer`)} />
          ) : null}
        </View>
      ) : null}
      {showReceivingChecklist ? (
        <View style={styles.actions}>
          <Button
            title="Receiving checklist"
            variant="secondary"
            onPress={() => router.push(`/receiving/checklist/${id}`)}
          />
        </View>
      ) : null}

      {recruit.custodyPhase ? (
        <>
          <SectionHeader title="Custody" />
          <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
            <DetailField
              label="Phase"
              value={CUSTODY_PHASE_METADATA[recruit.custodyPhase]?.label ?? recruit.custodyPhase}
            />
            <DetailField label="Intended destination" value={formatIntendedAssignment(recruit)} />
          </View>
        </>
      ) : null}

      <SectionHeader title="Identification" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <DetailField label="First name" value={recruit.firstName} />
        <DetailField label="Middle initial" value={recruit.middleInitial} />
        <DetailField label="Last name" value={recruit.lastName} />
        <DetailField label="Rank" value={recruit.rank} />
        <DetailField label="Status" value={recruit.status} />
        <DetailField label="EDIPI" value={formatEdipiForDisplay(recruit)} />
      </View>

      <SectionHeader title="Equipment" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <DetailField label="Weapons serial number" value={recruit.weaponsSerialNumber} />
        <DetailField label="RCO serial number" value={recruit.rcoSerialNumber} />
      </View>

      <SectionHeader title="Assignment" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <DetailField label="Regiment" value={recruit.regiment} />
        <DetailField label="Battalion" value={recruit.battalion} />
        <DetailField label="Company" value={recruit.company} />
        <DetailField label="Series" value={recruit.series} />
        <DetailField label="Platoon" value={recruit.platoon} />
      </View>

      <SectionHeader title="Physical" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <DetailField
          label="Height (in)"
          value={recruit.heightInches != null ? String(recruit.heightInches) : undefined}
        />
        <DetailField
          label="Weight at intake (lbs)"
          value={recruit.weightPounds != null ? String(recruit.weightPounds) : undefined}
        />
      </View>

      {canSeeExtended && hasExtendedInfo ? (
        <>
          <SectionHeader title="Extended information" />
          <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
            {recruit.medicalNotes ? (
              <DetailField label="Medical notes" value={recruit.medicalNotes} />
            ) : null}
            {recruit.dietaryRestrictions ? (
              <DetailField label="Dietary restrictions" value={recruit.dietaryRestrictions} />
            ) : null}
            {recruit.preferredContactMethod ? (
              <DetailField
                label="Preferred contact"
                value={recruit.preferredContactMethod === 'phone' ? 'Phone' : 'Email'}
              />
            ) : null}
            {recruit.extendedNotes ? (
              <DetailField label="Notes" value={recruit.extendedNotes} />
            ) : null}
          </View>
        </>
      ) : null}


      {user ? (
        <RecruitWeightSection recruit={recruit} appUser={appUser} userId={user.uid} />
      ) : null}

      {user ? (
        <RecruitProgressSection recruit={recruit} appUser={appUser} userId={user.uid} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.base,
    gap: 12,
  },
  name: { ...typography.title },
  card: { borderRadius: radius.lg, padding: spacing.xl, gap: 16, marginBottom: spacing.base },
  field: { gap: 4 },
  fieldLabel: { ...typography.overline, textTransform: 'none', letterSpacing: 0 },
  fieldValue: { ...typography.body, fontWeight: '500' },
  actions: { gap: 12, marginBottom: spacing.base },
});
