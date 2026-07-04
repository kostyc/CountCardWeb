import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import type { OrganizationalAssignment, Regiment, UserRole } from '@countcard/core/types/auth';
import type { Battalion, Company, Series } from '@countcard/core/validation/organizationSchemas';
import { checkPermission } from '@countcard/core/permissions/utils';
import { listUserProfiles, updateUserProfile } from '@countcard/firebase/services/userProfiles';
import { useAuth } from '@/context/AuthContext';
import { useAppUser, refreshAuthToken } from '@/hooks/useAppUser';
import { Screen, SectionHeader, Input, Select, Button, ListRow } from '@/components/ui';
import { USER_ROLES, REGIMENT_OPTIONS, BATTALIONS, BATTALION_COMPANIES, SERIES } from '@/constants/profileOptions';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

interface UserRow {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
}

export default function AdminScreen() {
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const theme = useAppTheme();
  const canAssign = checkPermission(appUser, 'assign_roles');

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [role, setRole] = useState<UserRole | ''>('');
  const [regiment, setRegiment] = useState<Regiment | ''>('');
  const [battalion, setBattalion] = useState<Battalion | ''>('');
  const [company, setCompany] = useState<Company | ''>('');
  const [series, setSeries] = useState<Series | ''>('');
  const [platoon, setPlatoon] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const profiles = await listUserProfiles({ search: search || undefined, limit: 50 });
      setUsers(
        profiles.map((p) => ({
          userId: p.userId,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          role: p.role,
        }))
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canAssign.allowed) loadUsers();
    else setLoading(false);
  }, [canAssign.allowed, search]);

  async function assignRole() {
    if (!user || !selected || !role) return;
    setSubmitting(true);
    try {
      const organizationalAssignment: OrganizationalAssignment = {
        regiment: regiment || undefined,
        battalion: battalion || undefined,
        company: company || undefined,
        series: series || undefined,
        platoon: platoon || undefined,
      };

      await updateUserProfile(
        selected.userId,
        { role, organizationalAssignment },
        user.uid
      );

      // Firestore trigger syncUserClaimsOnProfileWrite sets custom claims server-side
      if (selected.userId === user.uid) {
        await new Promise((r) => setTimeout(r, 1500));
        await refreshAuthToken();
      }

      Alert.alert('Success', 'Role updated.');
      setSelected(null);
      loadUsers();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Assignment failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!canAssign.allowed) {
    return (
      <Screen scroll>
        <Text style={[styles.denied, { color: theme.colors.textMuted }]}>
          You do not have permission to manage users.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionHeader title="User search" subtitle="Find users to assign roles" />
      <Input label="Search" value={search} onChangeText={setSearch} placeholder="Name or email" />

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 24 }} />
      ) : (
        <View style={[styles.group, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
          {users.map((u, i) => (
            <ListRow
              key={u.userId}
              title={`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || u.userId}
              subtitle={u.role ?? 'No role'}
              onPress={() => setSelected(u)}
              isFirst={i === 0}
              isLast={i === users.length - 1}
            />
          ))}
        </View>
      )}

      {selected ? (
        <View style={[styles.form, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
          <Text style={[styles.formTitle, { color: theme.colors.text }]}>
            Assign role — {selected.email ?? selected.userId}
          </Text>
          <Select label="Role" value={role} options={USER_ROLES} onChange={setRole} />
          <Select label="Regiment" value={regiment} options={REGIMENT_OPTIONS} onChange={setRegiment} />
          <Select
            label="Battalion"
            value={battalion}
            options={BATTALIONS.map((b) => ({ value: b, label: b }))}
            onChange={(v) => {
              setBattalion(v);
              setCompany('');
            }}
          />
          {battalion ? (
            <Select
              label="Company"
              value={company}
              options={(BATTALION_COMPANIES[battalion] ?? []).map((c) => ({ value: c, label: c }))}
              onChange={setCompany}
            />
          ) : null}
          <Select
            label="Series"
            value={series}
            options={SERIES.map((s) => ({ value: s, label: s }))}
            onChange={setSeries}
          />
          <Input label="Platoon" value={platoon} onChangeText={setPlatoon} />
          <View style={styles.row}>
            <Button title="Cancel" variant="ghost" onPress={() => setSelected(null)} style={styles.half} />
            <Button title="Save" loading={submitting} onPress={assignRole} style={styles.half} />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  denied: { ...typography.body, textAlign: 'center', marginTop: 40, paddingHorizontal: spacing.xl },
  group: { borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.lg },
  form: { borderRadius: radius.lg, padding: spacing.xl, gap: 4 },
  formTitle: { ...typography.headline, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: 12, marginTop: spacing.md },
  half: { flex: 1 },
});
