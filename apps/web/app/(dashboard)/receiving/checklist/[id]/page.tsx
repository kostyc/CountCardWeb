'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { getRecruitProfileById } from '@/lib/services/firestore/recruits';
import { ReceivingChecklistForm } from '@/components/receiving/ReceivingChecklistForm';
import type { RecruitProfile } from '@/types/models';
import ErrorState from '@/components/feedback/ErrorState';

export default function ReceivingChecklistPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const recruitId = params?.id as string;
  const [recruit, setRecruit] = useState<RecruitProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getRecruitProfileById(recruitId).then((r) => {
      setRecruit(r);
      setLoading(false);
    });
  }, [recruitId]);

  if (loading) return <Container>Loading…</Container>;
  if (!recruit) {
    return (
      <Container>
        <ErrorState title="Not found" message="Recruit not found" onRetry={() => router.back()} />
      </Container>
    );
  }

  return (
    <Container>
      <Breadcrumbs
        items={[
          { label: 'Receiving', href: '/receiving/transfers' },
          { label: `${recruit.lastName}, ${recruit.firstName}`, href: `/recruits/${recruitId}` },
          { label: 'Checklist', href: `/receiving/checklist/${recruitId}` },
        ]}
      />
      <ReceivingChecklistForm
        recruit={recruit}
        onUpdated={() => void getRecruitProfileById(recruitId).then(setRecruit)}
      />
    </Container>
  );
}
