'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { RecruitForm, type RecruitFormData } from '@/components/recruits/RecruitForm';
import { createRecruitProfile } from '@/lib/services/firestore/recruits';
import { createDefaultReceivingChecklist } from '@countcard/core/constants/receivingChecklist';
import { deriveRecruitDocumentId, normalizeEdipiDigits } from '@countcard/core/utils/recruitEdipi';
import { useToast } from '@/context/ToastContext';
import { useState } from 'react';

export default function ReceivingIntakePage(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: RecruitFormData) {
    if (!user) return;
    setLoading(true);
    try {
      const recruitDocId = deriveRecruitDocumentId(formData.edipi);
      await createRecruitProfile(
        recruitDocId,
        {
          recruitId: recruitDocId,
          edipi: normalizeEdipiDigits(formData.edipi) || undefined,
          firstName: formData.firstName,
          lastName: formData.lastName,
          rank: formData.rank as 'E-1' | 'E-2' | 'E-3',
          status: 'active',
          regiment: (formData.regiment as 'West' | 'East') ?? 'West',
          battalion: formData.battalion ?? 'Support',
          company: formData.company ?? 'Receiving',
          platoon: formData.platoon,
          custodyPhase: 'receiving',
          receivingChecklist: createDefaultReceivingChecklist(),
          heightInches: formData.heightInches ? Number(formData.heightInches) : undefined,
          weightPounds: formData.weightPounds ? Number(formData.weightPounds) : undefined,
          initialPft:
            formData.initialPftPullUps || formData.initialPftPlankSeconds
              ? {
                  pullUps: formData.initialPftPullUps ? Number(formData.initialPftPullUps) : undefined,
                  plankSeconds: formData.initialPftPlankSeconds
                    ? Number(formData.initialPftPlankSeconds)
                    : undefined,
                  recordedAt: new Date(),
                }
              : undefined,
          initialCft: formData.initialCftTotal
            ? { totalScore: Number(formData.initialCftTotal), recordedAt: new Date() }
            : undefined,
          createdBy: user.uid,
        },
        user.uid
      );
      showToast({ variant: 'success', message: 'Recruit added at Receiving.' });
      router.push(`/receiving/checklist/${recruitDocId}`);
    } catch (e) {
      showToast({
        variant: 'error',
        message: e instanceof Error ? e.message : 'Failed to create recruit',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Receiving', href: '/receiving/transfers' },
          { label: 'Intake', href: '/receiving/intake' },
        ]}
      />
      <RecruitForm
        receivingMode
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => router.push('/receiving/transfers')}
        loading={loading}
      />
    </Container>
  );
}
