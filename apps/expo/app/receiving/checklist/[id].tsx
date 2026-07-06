import { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { getRecruitProfileById } from '@countcard/firebase/services/recruits';
import type { RecruitProfile } from '@countcard/core/types/models';
import { canPerformReceivingWorkflow } from '@countcard/core/permissions/adminAccess';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, SectionHeader, Button } from '@/components/ui';
import { ReceivingChecklistForm } from '@/components/receiving/ReceivingChecklistForm';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/constants/theme';

export default function ReceivingChecklistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const theme = useAppTheme();
  const [recruit, setRecruit] = useState<RecruitProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const canAccess = canPerformReceivingWorkflow(appUser);

  const reload = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getRecruitProfileById(id)
      .then(setRecruit)
      .finally(() => setLoading(false));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  if (!canAccess && appUser) {
    return (
      <Screen scroll>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 }}>
          Receiving workflow access required.
        </Text>
      </Screen>
    );
  }

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
        <Button title="Go back" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionHeader
        title={`${recruit.lastName}, ${recruit.firstName}`}
        subtitle="Receiving medical checklist"
      />
      <ReceivingChecklistForm recruit={recruit} onUpdated={reload} />
      <Button title="View recruit profile" variant="secondary" onPress={() => router.push(`/recruits/${id}`)} />
      <Button title="Back to transfers" variant="secondary" onPress={() => router.push('/receiving/transfers')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: spacing.xl * 2 },
});
