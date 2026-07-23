import { useState } from 'react';
import { View, Text, StyleSheet, Alert, Linking, Platform } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import {
  INCIDENT_TYPE_OPTIONS,
  getIncidentSopTemplate,
} from '@countcard/core/constants/incidentSopTemplates';
import { canInitiateIncidentAlert } from '@countcard/core/permissions/incidentAlerts';
import { incidentAlertCreateSchema } from '@countcard/core/validation/incidentAlertSchemas';
import { getEffectiveOrganizationalAssignment } from '@countcard/core/utils/effectiveOrgAssignment';
import type {
  IncidentSubjectType,
  IncidentType,
  OrganizationalAssignment,
} from '@countcard/core/types/models';
import { createIncidentAlert } from '@countcard/firebase/services/incidentAlerts';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, Button, Input, Select, SectionHeader } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { palette, radius, spacing, typography } from '@/constants/theme';

const SUBJECT_OPTIONS: Array<{ value: IncidentSubjectType; label: string }> = [
  { value: 'recruit', label: 'Recruit' },
  { value: 'di', label: 'Drill Instructor / staff' },
  { value: 'civilian', label: 'Civilian' },
  { value: 'unknown', label: 'Unknown / not sure' },
];

export default function EmergencyNewScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const [incidentType, setIncidentType] = useState<IncidentType>('medical_injury');
  const [subjectType, setSubjectType] = useState<IncidentSubjectType>('unknown');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const template = getIncidentSopTemplate(incidentType);
  const canStart = canInitiateIncidentAlert(appUser);

  async function handleCall911() {
    const url = Platform.OS === 'ios' ? 'telprompt:911' : 'tel:911';
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to dial', 'Call 911 from your phone dialer.');
    }
  }

  async function handleConfirm() {
    if (!user || !appUser) return;
    if (!canStart) {
      Alert.alert('Role required', 'Complete your profile role before starting an emergency alert.');
      return;
    }
    const org = getEffectiveOrganizationalAssignment(appUser) as OrganizationalAssignment | undefined;
    if (!org?.battalion || !org?.company) {
      Alert.alert(
        'Assignment required',
        'Set your battalion and company in your profile before starting an emergency alert.'
      );
      return;
    }

    const parsed = incidentAlertCreateSchema.safeParse({
      incidentType,
      description: description.trim() || `${template.titlePrefix} — immediate assistance required`,
      location: location.trim() || undefined,
      subjectType,
      severity: 5,
      organizationalScope: org,
    });
    if (!parsed.success) {
      Alert.alert('Invalid form', parsed.error.issues[0]?.message ?? 'Check your entries.');
      return;
    }

    setSubmitting(true);
    try {
      const alertId = await createIncidentAlert({
        incidentType: parsed.data.incidentType,
        description: parsed.data.description,
        location: parsed.data.location,
        subjectType: parsed.data.subjectType,
        relatedRecruitIds: parsed.data.relatedRecruitIds,
        severity: parsed.data.severity,
        organizationalScope: org,
        createdBy: user.uid,
      });
      router.replace(`/emergency/${alertId}` as Href);
    } catch (e) {
      Alert.alert('Failed to start alert', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <View style={[styles.banner, { backgroundColor: palette.marineRed }]}>
        <Text style={styles.bannerTitle}>EMERGENCY</Text>
        <Text style={styles.bannerSub}>
          Notifies company chain of command (platoon staff, both CDIs, series commander, XO /
          CO / 1stSgt) and starts the SOP checklist. Placeholder SOP until command provides the
          official medical list.
        </Text>
      </View>

      <SectionHeader title="Incident details" subtitle="Default is medical / injury" />

      <Select
        label="Type"
        value={incidentType}
        options={INCIDENT_TYPE_OPTIONS}
        onChange={setIncidentType}
      />
      <Select
        label="Who is affected"
        value={subjectType}
        options={SUBJECT_OPTIONS}
        onChange={setSubjectType}
      />
      <Input
        label="Location"
        value={location}
        onChangeText={setLocation}
        placeholder="e.g. Barracks 3, PT field, Gate 2"
      />
      <Input
        label="What happened"
        value={description}
        onChangeText={setDescription}
        placeholder="Brief description"
        multiline
      />

      <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
        Notifies company CoC (incident type does not change recipients). Only the Company
        Commander can later notify battalion. {template.tasks.length} SOP tasks will spawn (
        {template.sopSource} v{template.sopVersion}).
      </Text>

      <View style={styles.actions}>
        <Button title="Call 911" variant="secondary" onPress={handleCall911} />
        <Button
          title="Confirm emergency alert"
          variant="danger"
          onPress={handleConfirm}
          loading={submitting}
          disabled={!canStart}
        />
        <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  bannerTitle: {
    ...typography.title,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  bannerSub: {
    ...typography.callout,
    color: 'rgba(255,255,255,0.9)',
  },
  hint: {
    ...typography.caption,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  actions: {
    gap: 10,
    marginBottom: spacing.xl,
  },
});
