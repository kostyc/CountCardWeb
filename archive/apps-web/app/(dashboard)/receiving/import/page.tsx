'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Container } from '@/components/ui/Container';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import ErrorState from '@/components/feedback/ErrorState';
import { Button } from '@/components/ui/Button';
import { RecruitImport } from '@/components/recruits/RecruitImport';

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Receiving', href: '/receiving/transfers' },
  { label: 'Import roster', href: '/receiving/import' },
];

export default function ReceivingImportPage(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { canReceivingWorkflow: canImportReceiving, isFullAdmin } = useAdminAccess();
  const canImport = canImportReceiving || isFullAdmin;
  const { showToast } = useToast();

  useEffect(() => {
    if (user && !canImport) {
      showToast({
        variant: 'error',
        message: 'Receiving workflow access required to import at Receiving.',
      });
      router.push('/receiving/transfers');
    }
  }, [user, canImport, showToast, router]);

  if (user && !canImport) {
    return (
      <Container>
        <ErrorState
          title="Access Denied"
          message="Support Battalion / Receiving Company access required."
          retryLabel="Back to transfers"
          onRetry={() => router.push('/receiving/transfers')}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="full" padding="md">
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex flex-wrap gap-2">
          <Link href="/receiving/intake">
            <Button variant="secondary">Single recruit intake</Button>
          </Link>
          <Link href="/receiving/transfers">
            <Button variant="secondary">Transfer batches</Button>
          </Link>
        </div>
        <RecruitImport
          receivingMode
          onImportComplete={() => {
            router.push('/receiving/transfers');
          }}
        />
      </div>
    </Container>
  );
}
