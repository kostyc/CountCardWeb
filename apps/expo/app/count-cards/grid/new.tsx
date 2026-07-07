import { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Alert, Share, Text, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { checkPermission } from '@countcard/core/permissions/utils';
import type { WorkflowHistoryEntry } from '@countcard/core/types/models';
import {
  DISPOSITION_FIELDS,
  hasActiveDispositionAssignments,
  initializeRowFromRoster,
  isGridRowEmpty,
  validateGridRow,
  withComputedRowTotal,
} from '@countcard/core/utils/countCardGrid';
import { countRecruitsWithWeapons } from '@countcard/core/utils/recruitDisplay';
import { getEffectiveOrganizationalAssignment } from '@countcard/core/utils/effectiveOrgAssignment';
import {
  isMcrdCountCardCompanyGridRole,
  seedMcrdCountCardRows,
} from '@countcard/core/utils/mcrdCountCardGrid';
import { backgroundColorForBattalion } from '@/components/countCards/CountCardGridTheme';
import type { CountCardGridRow } from '@countcard/core/types/models';
import { mcrdCountCardCreateSchema } from '@countcard/core/validation/mcrdCountCardSchemas';
import {
  buildMcrdCountCardTrainingSnapshot,
  createMcrdCountCard,
} from '@countcard/firebase/services/mcrdCountCards';
import { getCompanyTrainingDay } from '@countcard/firebase/services/companyTrainingDays';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { usePlatoonRosters } from '@/hooks/usePlatoonRosters';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatMcrdSaveError } from '@/lib/formatMcrdSaveError';
import { userAlert } from '@/lib/userAlert';
import { Screen, Button } from '@/components/ui';
import { CountCardGridCompact } from '@/components/countCards/CountCardGridCompact';
import { CompanyTrainingDayPanel } from '@/components/countCards/CompanyTrainingDayPanel';
import { formatMcrdCountCardForClipboard } from '@/components/countCards/formatMcrdCountCardClipboard';
import { spacing } from '@/constants/theme';

const SERIES_OPTIONS = [
  { value: 'Lead', label: 'Lead Series' },
  { value: 'Follow', label: 'Follow Series' },
];

function generateId(): string {
  return `MCC-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export default function NewMcrdCountCardScreen() {
  const { user } = useAuth();
  const { appUser, loading: appUserLoading } = useAppUser(user);
  const router = useRouter();
  const theme = useAppTheme();
  const org = getEffectiveOrganizationalAssignment(appUser);
  const role = appUser?.customClaims?.role ?? appUser?.profile?.role;
  const userPlatoon = org?.platoon;
  const canEditAll = isMcrdCountCardCompanyGridRole(role);
  const canCreate = checkPermission(appUser, 'create_count_card');

  const [series, setSeries] = useState(org?.series?.includes('Follow') ? 'Follow' : 'Lead');
  const [event, setEvent] = useState('');
  const [trainingDayCode, setTrainingDayCode] = useState('');
  const [trainingDayPhase, setTrainingDayPhase] = useState<1 | 2 | 3 | 4>(1);
  const [f1Friday, setF1Friday] = useState<Date | null>(null);
  const [dayConfigured, setDayConfigured] = useState(false);
  const [rows, setRows] = useState<CountCardGridRow[]>(() =>
    seedMcrdCountCardRows({ company: org?.company, userPlatoon, role, series })
  );
  const [rowsSeeded, setRowsSeeded] = useState(false);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const countDate = useMemo(() => new Date(), []);
  const countDateLabel = countDate.toLocaleDateString();
  const backgroundColor = backgroundColorForBattalion(org?.battalion);

  const platoonIds = useMemo(
    () => [...new Set(rows.map((r) => r.platoon).filter(Boolean))],
    [rows]
  );
  const { rosterByPlatoon, loading: rosterLoading, error: rosterError } = usePlatoonRosters(
    platoonIds,
    {
      regiment: org?.regiment,
      battalion: org?.battalion,
      company: org?.company,
    }
  );

  function rosterSizeForPlatoon(platoon?: string): number {
    const key = platoon?.trim();
    if (!key) return 0;
    return rosterByPlatoon[key]?.length ?? rosterByPlatoon[platoon]?.length ?? 0;
  }

  function normalizeRowForRoster(row: CountCardGridRow): CountCardGridRow {
    const size = rosterSizeForPlatoon(row.platoon);
    if (size > 0) return row;
    if (!row.dispositionAssignments) return row;
    const { dispositionAssignments: _removed, ...rest } = row;
    return rest;
  }

  const hasAnyRoster = platoonIds.some((p) => rosterSizeForPlatoon(p) > 0);
  const hasUnavailableRoster =
    !rosterLoading &&
    platoonIds.some((p) => {
      const key = p.trim();
      return key && Object.prototype.hasOwnProperty.call(rosterByPlatoon, key) && rosterSizeForPlatoon(p) === 0;
    });

  useEffect(() => {
    if (appUserLoading || rowsSeeded) return;
    if (!appUser) return;

    setRows(
      seedMcrdCountCardRows({
        company: org?.company,
        userPlatoon,
        role,
        series,
      })
    );
    setRowsSeeded(true);
  }, [appUser, appUserLoading, org?.company, userPlatoon, role, series, rowsSeeded]);

  useEffect(() => {
    if (!canEditAll || role !== 'senior_drill_instructor' && role !== 'chief_drill_instructor') {
      return;
    }
    setRows((prev) => {
      const hasData = prev.some((row) => !isGridRowEmpty(row));
      if (hasData) return prev;
      return seedMcrdCountCardRows({
        company: org?.company,
        userPlatoon,
        role,
        series,
      });
    });
  }, [series, canEditAll, role, org?.company, userPlatoon]);

  const rosterFingerprint = useMemo(
    () =>
      Object.entries(rosterByPlatoon)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([platoon, recruits]) => `${platoon}:${recruits.length}`)
        .join('|'),
    [rosterByPlatoon]
  );

  useEffect(() => {
    if (!rosterFingerprint) return;
    setRows((prev) => {
      let changed = false;
      const next = prev.map((row) => {
        const platoonKey = row.platoon?.trim() ?? '';
        const roster =
          rosterByPlatoon[platoonKey] ??
          (row.platoon ? rosterByPlatoon[row.platoon] : undefined);
        if (!roster?.length) {
          if (hasActiveDispositionAssignments(row.dispositionAssignments)) return row;
          const normalized = normalizeRowForRoster(row);
          if (normalized !== row) changed = true;
          return normalized;
        }

        const rosterIds = roster.map((r) => r.recruitId);
        const weapons = countRecruitsWithWeapons(roster);

        let updated: CountCardGridRow;
        if (hasActiveDispositionAssignments(row.dispositionAssignments)) {
          updated = initializeRowFromRoster(row, rosterIds, weapons);
        } else {
          const hasManualDisposition = DISPOSITION_FIELDS.some((field) => (row[field] ?? 0) > 0);
          if (hasManualDisposition || row.totalStrength != null) {
            updated = {
              ...row,
              totalStrength: row.totalStrength ?? rosterIds.length,
              dispositionAssignments: row.dispositionAssignments ?? {},
            };
          } else {
            updated = initializeRowFromRoster(row, rosterIds, weapons);
          }
        }

        if (updated !== row) changed = true;
        return updated;
      });
      return changed ? next : prev;
    });
  }, [rosterFingerprint, rosterByPlatoon]);

  useEffect(() => {
    if (!user || !org?.regiment || !org.battalion || !org.company) return;
    getCompanyTrainingDay(org.regiment, org.battalion, org.company)
      .then((doc) => {
        if (doc) {
          setTrainingDayCode(doc.currentTrainingDayCode);
          setTrainingDayPhase(doc.currentTrainingDayPhase);
          setF1Friday(
            doc.f1Friday instanceof Date ? doc.f1Friday : doc.f1Friday.toDate()
          );
          setDayConfigured(true);
        } else {
          setDayConfigured(false);
        }
      })
      .catch((e) => {
        setDayConfigured(false);
        void userAlert(
          'Unable to load Training Day',
          e instanceof Error ? e.message : 'Could not load company training day.'
        );
      });
  }, [user, org?.regiment, org?.battalion, org?.company]);

  function handleRowChange(index: number, row: CountCardGridRow) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = withComputedRowTotal(row);
      return next;
    });
  }

  function reportSaveIssue(title: string, message: string) {
    setSaveError(message);
    void userAlert(title, message);
  }

  async function handleSave(draft: boolean) {
    setSaveError(null);

    if (!user || !org?.company || !org.regiment || !org.battalion) {
      reportSaveIssue('Error', 'Company assignment required.');
      return;
    }
    if (appUserLoading) {
      reportSaveIssue('Please wait', 'Your profile is still loading. Try again in a moment.');
      return;
    }
    if (!canCreate.allowed) {
      reportSaveIssue('Denied', canCreate.reason ?? 'No permission to create count cards.');
      return;
    }
    const activeRows = rows
      .map(withComputedRowTotal)
      .filter((row) => !isGridRowEmpty(row))
      .map(normalizeRowForRoster);

    if (role === 'drill_instructor' && !userPlatoon) {
      const missingPlatoon = activeRows.some((row) => !row.platoon?.trim());
      if (missingPlatoon) {
        reportSaveIssue(
          'Platoon required',
          'Enter your platoon name in the PLT column before submitting.'
        );
        return;
      }
    }
    if (activeRows.length === 0) {
      reportSaveIssue('Validation', 'Enter at least one platoon row with counts.');
      return;
    }

    const rowErrors = activeRows.flatMap((row) =>
      validateGridRow(row, { rosterSize: rosterSizeForPlatoon(row.platoon) })
    );
    if (rowErrors.length) {
      reportSaveIssue('Validation', rowErrors.slice(0, 5).join('\n'));
      return;
    }

    setSubmitting(true);
    try {
      let snapshot = {
        trainingDayCode,
        trainingDayPhase,
        f1Friday: f1Friday ?? new Date(),
      };
      if (!dayConfigured) {
        snapshot = await buildMcrdCountCardTrainingSnapshot(
          org.regiment,
          org.battalion,
          org.company,
          countDate
        );
      } else if (!trainingDayCode.trim()) {
        reportSaveIssue(
          'Training day',
          'Company training day is not loaded yet. Wait a moment and try again.'
        );
        return;
      }

      const workflowState = draft ? ('draft' as const) : ('submitted' as const);
      const workflowHistoryEntry: WorkflowHistoryEntry = {
        state: workflowState,
        timestamp: Timestamp.now(),
        userId: user.uid,
        notes: draft
          ? 'Count card saved as draft'
          : 'Submitted to Senior Drill Instructor',
      };

      const countCardId = generateId();
      const payload = {
        countCardId,
        regiment: org.regiment,
        battalion: org.battalion,
        company: org.company,
        series,
        event: event.trim() || undefined,
        countDate: Timestamp.fromDate(countDate),
        trainingDayCode: snapshot.trainingDayCode,
        trainingDayPhase: snapshot.trainingDayPhase,
        f1Friday: Timestamp.fromDate(snapshot.f1Friday),
        backgroundColor,
        rows: activeRows,
        notes: comments.trim() || undefined,
        status: 'pending' as const,
        workflowState,
        submittedBy: user.uid,
        location: org.platoon ? `Platoon ${org.platoon}` : undefined,
        workflowHistory: [workflowHistoryEntry],
      };

      const validationResult = mcrdCountCardCreateSchema.safeParse({
        ...payload,
        countDate: countDate.toISOString(),
        f1Friday: snapshot.f1Friday.toISOString(),
        workflowHistory: payload.workflowHistory.map((entry) => ({
          ...entry,
          timestamp:
            entry.timestamp instanceof Timestamp
              ? entry.timestamp.toDate()
              : entry.timestamp,
        })),
      });
      if (!validationResult.success) {
        reportSaveIssue('Validation', formatMcrdSaveError(validationResult.error));
        return;
      }

      await createMcrdCountCard(countCardId, { ...payload, createdBy: user.uid }, user.uid);
      await userAlert('Saved', draft ? 'Draft saved.' : 'Submitted to SDI.');
      router.replace(`/count-cards/grid/${countCardId}`);
    } catch (e) {
      reportSaveIssue('Error', formatMcrdSaveError(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    const text = formatMcrdCountCardForClipboard({
      company: org?.company ?? '',
      series,
      event: event.trim() || undefined,
      trainingDayCode,
      countDate,
      rows,
      notes: comments.trim() || undefined,
    });
    try {
      await Share.share({ message: text });
    } catch {
      Alert.alert('Copy', 'Share sheet cancelled.');
    }
  }

  if (appUserLoading) {
    return (
      <Screen>
        <ActivityIndicator size="large" style={{ marginTop: spacing.xl }} />
      </Screen>
    );
  }

  return (
    <Screen scroll padded={false} contentContainerStyle={styles.screenContent}>
      <View style={styles.paddedSection}>
        <CompanyTrainingDayPanel
          trainingDayCode={trainingDayCode}
          configured={dayConfigured}
        />

        {role === 'drill_instructor' && userPlatoon ? (
          <Text style={styles.platoonHint}>Platoon {userPlatoon} (from your profile)</Text>
        ) : null}

        {role === 'drill_instructor' && !userPlatoon ? (
          <Text style={styles.platoonWarning}>
            No platoon on your profile — enter your platoon in the PLT column below.
          </Text>
        ) : null}

        {rosterLoading || rosterError ? (
          <View style={[styles.rosterStatus, rosterLoading && styles.rosterStatusLoading]}>
            {rosterLoading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.rosterWarning}>
                Could not load roster — you can enter counts only. ({rosterError})
              </Text>
            )}
          </View>
        ) : null}
      </View>

      <CountCardGridCompact
        trainingDayCode={trainingDayCode || '—'}
        series={series}
        countDateLabel={countDateLabel}
        event={event}
        onEventChange={setEvent}
        backgroundColor={backgroundColor}
        rows={rows}
        userPlatoon={userPlatoon}
        canEditAllRows={canEditAll}
        seriesOptions={SERIES_OPTIONS}
        onSeriesChange={setSeries}
        comments={comments}
        onCommentsChange={setComments}
        rosterByPlatoon={rosterByPlatoon}
        rosterLoading={rosterLoading}
        rosterError={rosterError}
        onRowChange={handleRowChange}
      />

      <View style={styles.paddedSection}>
        {hasAnyRoster ? (
          <Text style={styles.rosterHint}>
            {Platform.OS === 'web' ? 'Click' : 'Tap'} BR, LD, SB, DENT, GG, or OTH to select
            recruits from your roster. T/S and T/P update automatically.
          </Text>
        ) : null}

        {hasUnavailableRoster ? (
          <Text style={styles.rosterWarning}>
            Roster unavailable for one or more platoons — enter counts only (no recruit names).
          </Text>
        ) : null}

        {saveError ? (
          <Text style={[styles.saveError, { color: theme.colors.error }]}>{saveError}</Text>
        ) : null}

        <View style={styles.footer}>
          <Button
            title="Copy / Share"
            variant="secondary"
            onPress={handleCopy}
            disabled={submitting}
          />
          <Button
            title="Save Draft"
            loading={submitting}
            disabled={submitting}
            onPress={() => void handleSave(true)}
          />
          <Button
            title="Submit to SDI"
            loading={submitting}
            disabled={submitting}
            onPress={() => void handleSave(false)}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
    width: '100%',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  paddedSection: {
    paddingHorizontal: Platform.select({ web: spacing.sm, default: spacing.md }),
  },
  rosterStatus: {
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  rosterStatusLoading: {
    minHeight: 44,
  },
  footer: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  rosterHint: {
    fontSize: 13,
    color: '#444',
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  rosterWarning: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  platoonHint: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: spacing.xs,
  },
  platoonWarning: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B00020',
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  saveError: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
});
