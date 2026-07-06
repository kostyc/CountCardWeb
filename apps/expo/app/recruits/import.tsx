import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import { DEFAULT_RECRUIT_RANK } from '@countcard/core/constants/recruitRanks';
import { hasPermission, isAdminRole } from '@countcard/core/permissions/roles';
import { canPerformReceivingWorkflow } from '@countcard/core/permissions/adminAccess';
import { RECEIVING_DEFAULT_ASSIGNMENT, RECEIVING_PLATOON } from '@countcard/core/constants/custodyPhase';
import { getRecruitListFilterLevel } from '@countcard/core/permissions/recruits';
import { getCompaniesByBattalion } from '@countcard/core/constants/organizations';
import type { Battalion, Company } from '@countcard/core/validation/organizationSchemas';
import type { ParsedRecruitImportRow, RecruitImportDuplicateWarning } from '@countcard/core/import/recruitExcelImport';
import {
  isImportRowReadyForCommit,
  normalizePlatoonNumber,
  refreshImportRowIdentity,
} from '@countcard/core/import/recruitExcelImport';
import { RecruitImportGrid } from '@/components/recruits/RecruitImportGrid';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import {
  MAX_ROSTER_PHOTO_PAGES,
  pickRosterDocumentImage,
  ROSTER_CAPTURE_TIPS,
} from '@/lib/rosterImagePicker';
import { pickRosterDocumentFile } from '@/lib/rosterDocumentPicker';
import type { PickedImage } from '@/lib/imageValidation';
import {
  commitRecruitImport,
  mergeParsedRosterPages,
  parseRosterDocumentFile,
  parseRosterImageViaApi,
  type RosterPageParseResult,
} from '@/lib/recruitImportApi';
import { Screen, Button, Input, Select, SectionHeader } from '@/components/ui';
import { RECRUIT_RANKS } from '@/constants/profileOptions';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography, radius, cardShadow } from '@/constants/theme';

interface RosterPage {
  id: string;
  image: PickedImage;
  status: 'pending' | 'parsing' | 'parsed' | 'error';
  error?: string;
  parseResult?: RosterPageParseResult;
}

function createPageId(): string {
  return `page-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function RecruitImportScreen() {
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const router = useRouter();
  const theme = useAppTheme();

  const [platoon, setPlatoon] = useState('');
  const [defaultCompany, setDefaultCompany] = useState<Company | ''>('');
  const [defaultRank, setDefaultRank] = useState<RecruitRank | ''>(DEFAULT_RECRUIT_RANK);
  const [pages, setPages] = useState<RosterPage[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedRecruitImportRow[]>([]);
  const [duplicateWarnings, setDuplicateWarnings] = useState<RecruitImportDuplicateWarning[]>([]);
  const [documentFileName, setDocumentFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsingDocument, setParsingDocument] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rankOptions = RECRUIT_RANKS;

  const receivingMode = useMemo(() => canPerformReceivingWorkflow(appUser), [appUser]);

  const canCreateAny = useMemo(() => {
    if (!appUser) return false;
    if (receivingMode) return true;
    const role = appUser.customClaims?.role || appUser.profile?.role;
    if (!role) return false;
    if (isAdminRole(role)) return true;
    return (
      hasPermission(role, 'edit_own_platoon') ||
      hasPermission(role, 'edit_series') ||
      hasPermission(role, 'edit_company') ||
      hasPermission(role, 'edit_battalion')
    );
  }, [appUser, receivingMode]);

  useEffect(() => {
    if (appUser && !canCreateAny) {
      Alert.alert('Access denied', 'You do not have permission to import recruits.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [appUser, canCreateAny, router]);

  useEffect(() => {
    const scopePlatoon =
      appUser?.customClaims?.organizationalAssignment?.platoon ??
      appUser?.profile?.organizationalAssignment?.platoon;
    if (scopePlatoon && !platoon) {
      setPlatoon(scopePlatoon);
    }
  }, [appUser, platoon]);

  const userBattalion = useMemo((): Battalion | undefined => {
    const battalion =
      appUser?.customClaims?.organizationalAssignment?.battalion ??
      appUser?.profile?.organizationalAssignment?.battalion;
    return battalion as Battalion | undefined;
  }, [appUser]);

  const companyOptions = useMemo(() => {
    if (!userBattalion) return [];
    return getCompaniesByBattalion(userBattalion).map((company) => ({
      value: company,
      label: company,
    }));
  }, [userBattalion]);

  const showDefaultCompany = useMemo(() => {
    const role = appUser?.customClaims?.role ?? appUser?.profile?.role;
    return getRecruitListFilterLevel(role) === 'battalion' && companyOptions.length > 0;
  }, [appUser, companyOptions.length]);

  useEffect(() => {
    const scopeCompany =
      appUser?.customClaims?.organizationalAssignment?.company ??
      appUser?.profile?.organizationalAssignment?.company;
    if (scopeCompany && !defaultCompany) {
      setDefaultCompany(scopeCompany as Company);
    }
  }, [appUser, defaultCompany]);

  useEffect(() => {
    if (!platoon) return;
    setParsedRows((prev) =>
      prev.map((row) => {
        if (/^\d{4}$/.test(row.platoon.trim())) return row;
        const normalized = normalizePlatoonNumber('', platoon);
        if (!normalized) return row;
        return refreshImportRowIdentity({ ...row, platoon: normalized });
      })
    );
  }, [platoon]);

  useEffect(() => {
    if (!defaultCompany) return;
    setParsedRows((prev) =>
      prev.map((row) => (row.company ? row : { ...row, company: defaultCompany }))
    );
  }, [defaultCompany]);

  const incompleteRowCount = useMemo(
    () => parsedRows.filter((row) => !isImportRowReadyForCommit(row)).length,
    [parsedRows]
  );

  const orgDefaults = useMemo(
    () =>
      receivingMode
        ? {
            regiment:
              appUser?.customClaims?.organizationalAssignment?.regiment ??
              appUser?.profile?.organizationalAssignment?.regiment ??
              'West',
            battalion: RECEIVING_DEFAULT_ASSIGNMENT.battalion,
            company: RECEIVING_DEFAULT_ASSIGNMENT.company,
            platoon: RECEIVING_PLATOON,
          }
        : {
            regiment: appUser?.customClaims?.organizationalAssignment?.regiment ?? appUser?.profile?.organizationalAssignment?.regiment,
            battalion: appUser?.customClaims?.organizationalAssignment?.battalion ?? appUser?.profile?.organizationalAssignment?.battalion,
            company:
              defaultCompany ||
              appUser?.customClaims?.organizationalAssignment?.company ||
              appUser?.profile?.organizationalAssignment?.company,
            series: appUser?.customClaims?.organizationalAssignment?.series ?? appUser?.profile?.organizationalAssignment?.series,
            platoon: platoon || undefined,
          },
    [appUser, platoon, defaultCompany, receivingMode]
  );

  function applyMergedPreview(nextPages: RosterPage[]) {
    const merged = mergeParsedRosterPages(
      nextPages.filter((page) => page.status === 'parsed' && page.parseResult).map((page) => page.parseResult!)
    );
    setParsedRows(merged.rows);
    setDuplicateWarnings(merged.duplicateWarnings);
    return merged.rows.length;
  }

  async function handleAddPage() {
    if (pages.length >= MAX_ROSTER_PHOTO_PAGES) {
      Alert.alert('Page limit', `Maximum ${MAX_ROSTER_PHOTO_PAGES} pages per import.`);
      return;
    }

    const result = await pickRosterDocumentImage();
    if (result.cancelled) return;
    if (!result.ok) {
      Alert.alert('Invalid image', result.error ?? 'Could not use that image.');
      return;
    }

    setDocumentFileName(null);
    setParsedRows([]);
    setDuplicateWarnings([]);
    setPages((prev) => [
      ...prev,
      { id: createPageId(), image: result.image, status: 'pending' },
    ]);
  }

  async function handleChooseDocument() {
    const result = await pickRosterDocumentFile();
    if (result.cancelled) return;
    if (!result.ok) {
      Alert.alert('Invalid file', result.error ?? 'Could not use that file.');
      return;
    }

    setParsingDocument(true);
    setError(null);
    setPages([]);
    setDocumentFileName(result.document.name);

    try {
      const parseResult = await parseRosterDocumentFile(result.document, orgDefaults, {
        defaultRank: (defaultRank || DEFAULT_RECRUIT_RANK) as RecruitRank,
      });
      const merged = mergeParsedRosterPages([parseResult]);
      setParsedRows(merged.rows);
      setDuplicateWarnings(merged.duplicateWarnings);

      if (merged.rows.length === 0) {
        setError(parseResult.errors[0]?.message ?? 'Could not parse roster file.');
      } else {
        if (parseResult.platoonHint && !platoon) {
          setPlatoon(parseResult.platoonHint);
        }
        const needsReview = merged.rows.filter((row) => row.missingFields.length > 0).length;
        if (needsReview > 0) {
          setError(`${needsReview} row(s) need required fields filled in before import.`);
        }
      }
    } catch (err) {
      setParsedRows([]);
      setDuplicateWarnings([]);
      setError(err instanceof Error ? err.message : 'Failed to parse roster file');
    } finally {
      setParsingDocument(false);
    }
  }

  function handleRemovePage(id: string) {
    setPages((prev) => {
      const next = prev.filter((page) => page.id !== id);
      if (next.some((page) => page.status === 'parsed')) {
        applyMergedPreview(next);
      } else {
        setParsedRows([]);
        setDuplicateWarnings([]);
      }
      return next;
    });
  }

  async function handleExtractPages() {
    const pending = pages.filter((page) => page.status === 'pending' || page.status === 'error');
    if (pending.length === 0) {
      Alert.alert('No pages', 'Add at least one roster photo first.');
      return;
    }

    setParsing(true);
    setError(null);
    setDocumentFileName(null);
    let failedPages = 0;
    const nextPages = [...pages];

    for (const page of pending) {
      const index = nextPages.findIndex((item) => item.id === page.id);
      if (index < 0) continue;

      nextPages[index] = { ...nextPages[index], status: 'parsing', error: undefined, parseResult: undefined };
      setPages([...nextPages]);

      try {
        const result = await parseRosterImageViaApi(page.image, orgDefaults, {
          defaultRank: (defaultRank || DEFAULT_RECRUIT_RANK) as RecruitRank,
          fileName: `roster-page-${index + 1}.jpg`,
        });

        if (result.rows.length === 0) {
          failedPages += 1;
          nextPages[index] = {
            ...nextPages[index],
            status: 'error',
            error: result.errors[0]?.message ?? 'Could not extract roster table',
            parseResult: result,
          };
        } else {
          nextPages[index] = {
            ...nextPages[index],
            status: 'parsed',
            error: undefined,
            parseResult: result,
          };
        }
      } catch (err) {
        failedPages += 1;
        nextPages[index] = {
          ...nextPages[index],
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to parse page',
        };
      }

      setPages([...nextPages]);
    }

    const rowCount = applyMergedPreview(nextPages);
    if (rowCount === 0) {
      setError(
        failedPages > 0
          ? 'Could not extract roster data. Retake photos with better lighting and framing.'
          : 'No recruit rows found in the selected pages.'
      );
    } else if (failedPages > 0) {
      setError(`${failedPages} page(s) failed to extract. Other pages were merged into the preview.`);
    }

    setParsing(false);
  }

  async function handleCommit(dryRun: boolean) {
    if (!user) {
      Alert.alert('Sign in required', 'You must be signed in to import recruits.');
      return;
    }
    if (parsedRows.length === 0) {
      Alert.alert('Nothing to import', 'Add and extract roster photos or upload a spreadsheet/PDF first.');
      return;
    }
    if (incompleteRowCount > 0) {
      Alert.alert(
        'Missing fields',
        `Fill in required fields for ${incompleteRowCount} recruit(s) before importing.`
      );
      return;
    }

    setCommitting(true);
    setError(null);
    try {
      const result = await commitRecruitImport(parsedRows, dryRun, user.uid, appUser, { receivingMode });
      const message = dryRun
        ? `Dry run: ${result.summary.created} would be created, ${result.summary.skipped} skipped, ${result.summary.failed} failed`
        : `Import complete: ${result.summary.created} created, ${result.summary.skipped} skipped, ${result.summary.failed} failed`;

      Alert.alert(dryRun ? 'Dry run complete' : 'Import complete', message, [
        {
          text: 'OK',
          onPress: () => {
            if (!dryRun && result.summary.created > 0) {
              router.replace(receivingMode ? '/receiving/transfers' : '/(tabs)/recruits');
            }
          },
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setCommitting(false);
    }
  }

  if (appUser && !canCreateAny) {
    return (
      <Screen scroll>
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          You do not have permission to import recruits.
        </Text>
      </Screen>
    );
  }

  const busy = parsing || parsingDocument || committing;

  return (
    <Screen scroll>
      <SectionHeader
        title={receivingMode ? 'Import at Receiving' : 'Import roster'}
        subtitle={
          receivingMode
            ? 'Bulk import into Support/Receiving custody with default checklist.'
            : 'Use camera, photos, Excel (.xlsx/.xls/.csv), or PDF — review, then import.'
        }
      />

      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Capture tips</Text>
        {ROSTER_CAPTURE_TIPS.map((tip) => (
          <Text key={tip} style={[styles.tip, { color: theme.colors.textSecondary }]}>
            • {tip}
          </Text>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        {receivingMode ? (
          <Text style={[styles.tip, { color: theme.colors.textSecondary }]}>
            Org locked to Support / Receiving (platoon {RECEIVING_PLATOON}). Recruits enter receiving custody.
          </Text>
        ) : (
          <>
            <Input label="Default platoon" value={platoon} onChangeText={setPlatoon} placeholder="e.g. 2001" keyboardType="number-pad" />
            {showDefaultCompany ? (
              <Select
                label="Default company"
                value={defaultCompany}
                onChange={(value) => setDefaultCompany(value as Company)}
                options={companyOptions}
                placeholder="Select company for this roster"
              />
            ) : null}
          </>
        )}
        <Select
          label="Default rank"
          value={defaultRank}
          onChange={(value) => setDefaultRank(value)}
          options={rankOptions}
        />
      </View>

      <View style={styles.actions}>
        <Button title="Add photo page" variant="secondary" onPress={handleAddPage} disabled={busy || pages.length >= MAX_ROSTER_PHOTO_PAGES} />
        <Button
          title={parsing ? 'Extracting…' : 'Extract photos'}
          onPress={handleExtractPages}
          disabled={busy || pages.filter((p) => p.status === 'pending' || p.status === 'error').length === 0}
          loading={parsing}
        />
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Spreadsheet or PDF</Text>
        <Text style={[styles.tip, { color: theme.colors.textSecondary }]}>
          Excel (.xlsx, .xls, .csv) parses on your device — no API required. PDF uses the web API when available.
        </Text>
        <Button
          title={parsingDocument ? 'Parsing file…' : 'Choose Excel or PDF'}
          variant="secondary"
          onPress={handleChooseDocument}
          disabled={busy}
          loading={parsingDocument}
        />
        {documentFileName && (
          <Text style={[styles.tip, { color: theme.colors.textSecondary }]}>Selected: {documentFileName}</Text>
        )}
      </View>

      {pages.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pageStrip}>
          {pages.map((page, index) => (
            <View key={page.id} style={[styles.pageCard, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
              <Image source={{ uri: page.image.uri }} style={styles.pageThumb} resizeMode="cover" />
              <Text style={[styles.pageLabel, { color: theme.colors.text }]}>Page {index + 1}</Text>
              <Text style={[styles.pageStatus, { color: theme.colors.textSecondary }]}>
                {page.status === 'pending' && 'Ready'}
                {page.status === 'parsing' && 'Extracting…'}
                {page.status === 'parsed' && 'Extracted'}
                {page.status === 'error' && (page.error ?? 'Failed')}
              </Text>
              <Button title="Remove" variant="secondary" onPress={() => handleRemovePage(page.id)} disabled={busy} />
            </View>
          ))}
        </ScrollView>
      )}

      {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}

      {duplicateWarnings.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Duplicate review</Text>
          {duplicateWarnings.map((warning) => (
            <Text key={`${warning.type}-${warning.rowNumber}`} style={[styles.tip, { color: theme.colors.textSecondary }]}>
              Row {warning.rowNumber}: {warning.message}
            </Text>
          ))}
        </View>
      )}

      {parsedRows.length > 0 && (
        <View style={styles.gridSection}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Roster grid ({parsedRows.length} recruit{parsedRows.length === 1 ? '' : 's'})
          </Text>
          {incompleteRowCount > 0 && (
            <Text style={[styles.tip, { color: theme.colors.error }]}>
              {incompleteRowCount} recruit(s) need required fields before import
            </Text>
          )}
          <View style={[styles.gridSurface, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
            <RecruitImportGrid
              rows={parsedRows}
              rankOptions={rankOptions}
              onChangeRows={setParsedRows}
              disabled={busy}
              textColor={theme.colors.text}
              textSecondary={theme.colors.textSecondary}
              surface={theme.colors.surface}
              borderColor={theme.colors.border}
              errorColor={theme.colors.error}
              successColor={theme.colors.primary}
            />
          </View>
          <View style={styles.actions}>
            <Button
              title="Validate (dry run)"
              variant="secondary"
              onPress={() => handleCommit(true)}
              loading={committing}
              disabled={busy || incompleteRowCount > 0}
            />
            <Button
              title="Import recruits"
              onPress={() => handleCommit(false)}
              loading={committing}
              disabled={busy || incompleteRowCount > 0}
            />
          </View>
        </View>
      )}

      {(parsing || parsingDocument || committing) && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.headline,
    fontSize: 16,
  },
  tip: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pageStrip: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  pageCard: {
    width: 160,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  pageThumb: {
    width: '100%',
    height: 120,
    borderRadius: radius.sm,
  },
  pageLabel: {
    ...typography.headline,
    fontSize: 14,
  },
  pageStatus: {
    ...typography.body,
    fontSize: 12,
  },
  previewRow: {
    ...typography.body,
    fontSize: 14,
  },
  errorText: {
    ...typography.body,
    marginBottom: spacing.md,
  },
  message: {
    ...typography.body,
    padding: spacing.md,
  },
  loadingRow: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  gridSection: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  gridSurface: {
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    overflow: 'hidden',
  },
});
