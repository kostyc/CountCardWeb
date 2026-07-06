import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { canPerformReceivingWorkflow } from '@countcard/core/permissions/adminAccess';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, EmptyState } from '@/components/ui';

export default function ReceivingImportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const canAccess = canPerformReceivingWorkflow(appUser);

  useEffect(() => {
    if (canAccess) {
      router.replace('/recruits/import');
    } else if (user && appUser) {
      router.replace('/receiving/transfers');
    }
  }, [canAccess, user, appUser, router]);

  if (!canAccess) {
    return (
      <Screen scroll>
        <EmptyState
          title="Access denied"
          description="Support Battalion / Receiving Company access required to import at Receiving."
        />
      </Screen>
    );
  }

  return null;
}
