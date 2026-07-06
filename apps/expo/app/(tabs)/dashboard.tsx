import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { canPerformReceivingWorkflow, canPerformIncomingCustodyWorkflow } from '@countcard/core/permissions/adminAccess';
import { useAppUser } from '@/hooks/useAppUser';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Screen, QuickActionCard, SectionHeader } from '@/components/ui';
import { palette, spacing, typography, radius } from '@/constants/theme';

function getInitials(email?: string | null): string {
  if (!email) return '?';
  const part = email.split('@')[0];
  return part.slice(0, 2).toUpperCase();
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const theme = useAppTheme();
  const router = useRouter();
  const showReceiving = canPerformReceivingWorkflow(appUser);
  const showIncoming = canPerformIncomingCustodyWorkflow(appUser);

  return (
    <Screen scroll>
      <View style={[styles.heroCard, { backgroundColor: theme.colors.header }, theme.scheme === 'light' && styles.heroShadow]}>
        <View style={styles.heroRow}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>{getInitials(user?.email)}</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroGreeting}>Welcome back</Text>
            <Text style={styles.heroEmail} numberOfLines={1}>
              {user?.email ?? 'Signed in'}
            </Text>
          </View>
        </View>
      </View>

      <SectionHeader title="Quick actions" subtitle="Jump to your most-used tools" />

      <View style={styles.grid}>
        <QuickActionCard
          title="Recruits"
          description="Profiles, ranks & assignments"
          icon="person.3.fill"
          onPress={() => router.push('/(tabs)/recruits')}
        />
        <QuickActionCard
          title="Count Cards"
          description="Accountability workflow"
          icon="checklist"
          onPress={() => router.push('/(tabs)/count-cards')}
        />
        <QuickActionCard
          title="Messages"
          description="Team conversations"
          icon="bubble.left.and.bubble.right.fill"
          onPress={() => router.push('/(tabs)/messages')}
        />
        <QuickActionCard
          title="DI Cards"
          description="Leadership forms & signatures"
          icon="doc.text.fill"
          onPress={() => router.push('/di-leadership-cards')}
        />
        <QuickActionCard
          title="Profile"
          description="Keys & security settings"
          icon="lock.shield.fill"
          onPress={() => router.push('/profile')}
        />
        <QuickActionCard
          title="Admin"
          description="Users & permissions"
          icon="person.badge.shield.checkmark.fill"
          onPress={() => router.push('/admin')}
        />
        {showReceiving ? (
          <QuickActionCard
            title="Receiving"
            description="Transfer batches & ready recruits"
            icon="arrow.triangle.branch"
            onPress={() => router.push('/receiving/transfers')}
          />
        ) : null}
        {showIncoming ? (
          <QuickActionCard
            title="Incoming"
            description="Accept recruit custody"
            icon="tray.and.arrow.down.fill"
            onPress={() => router.push('/company/incoming-recruits')}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  heroShadow: {
    shadowColor: palette.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: palette.onPrimary, fontSize: 18, fontWeight: '700' },
  heroText: { flex: 1 },
  heroGreeting: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  heroEmail: { ...typography.headline, color: palette.onPrimary },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
});
