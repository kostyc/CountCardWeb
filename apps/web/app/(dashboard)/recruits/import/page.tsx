'use client';

/**
 * Recruit Excel import page
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRecruitPermissions } from '@/hooks/useRecruitPermissions';
import { useToast } from '@/context/ToastContext';
import { Container } from '@/components/ui/Container';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import ErrorState from '@/components/feedback/ErrorState';
import { RecruitImport } from '@/components/recruits/RecruitImport';

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Recruits', href: '/recruits' },
  { label: 'Import', href: '/recruits/import' },
];

export default function RecruitImportPage(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { canCreateAny } = useRecruitPermissions();

  useEffect(() => {
    if (user && !canCreateAny) {
      showToast({
        variant: 'error',
        message: 'You do not have permission to import recruits.',
      });
      router.push('/recruits');
    }
  }, [user, canCreateAny, showToast, router]);

  if (user && !canCreateAny) {
    return (
      <Container>
        <ErrorState
          title="Access Denied"
          message="You do not have permission to import recruits."
          retryLabel="Back to recruits"
          onRetry={() => router.push('/recruits')}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="full" padding="md">
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        <RecruitImport
          onImportComplete={() => {
            router.push('/recruits');
          }}
        />
      </div>
    </Container>
  );
}
