'use client';

import { useState } from 'react';
import { Container } from '@/components/ui/Container';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { useAuth } from '@/context/AuthContext';
import { Timestamp } from 'firebase/firestore';
import {
  createDILeadershipCard,
  appendDIRecommendation,
  signDILeadershipCard,
} from '@/lib/services/firestore/diLeadershipCards';

export default function DILeadershipCardsPage(): JSX.Element {
  const { user } = useAuth();
  const [subjectUserId, setSubjectUserId] = useState('');
  const [authorRole, setAuthorRole] = useState<'sdi' | 'chief_di' | 'first_sgt'>('sdi');
  const [summary, setSummary] = useState('');
  const [cardId, setCardId] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);

  async function createCard() {
    if (!user) return;
    setLoading(true);
    try {
      const newCardId = `dic-${Date.now()}`;
      const org = user.customClaims?.organizationalAssignment;
      await createDILeadershipCard(
        newCardId,
        {
          cardId: newCardId,
          subjectUserId,
          authorRole,
          cardType: 'digital_form',
          summary,
          workflowState: 'draft',
          organizationalAssignment: {
            regiment: org?.regiment,
            battalion: org?.battalion,
            company: org?.company,
            series: org?.series,
            platoon: org?.platoon,
          },
          createdBy: user.uid,
        },
        user.uid
      );
      setCardId(newCardId);
    } finally {
      setLoading(false);
    }
  }

  async function appendRecommendationHandler() {
    if (!cardId || !user) return;
    setLoading(true);
    try {
      await appendDIRecommendation(cardId, user.uid, recommendation, user.uid);
      setRecommendation('');
    } finally {
      setLoading(false);
    }
  }

  async function sign(which: 'di' | 'senior') {
    if (!cardId || !user) return;
    setLoading(true);
    try {
      await signDILeadershipCard(
        cardId,
        which,
        {
          userId: user.uid,
          signedAt: Timestamp.now(),
          attestationHash: `attest-${Date.now()}`,
        },
        user.uid
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'DI Leadership Cards', href: '/di-leadership-cards' },
        ]}
      />
      <Card className="p-6 space-y-4">
        <h1 className="text-xl font-bold">DI Leadership Card (3x5 / Digital)</h1>
        <Input label="Subject DI user ID" value={subjectUserId} onChange={(e) => setSubjectUserId(e.target.value)} fullWidth />
        <Select
          label="Author role"
          value={authorRole}
          onChange={(e) => setAuthorRole(e.target.value as 'sdi' | 'chief_di' | 'first_sgt')}
          options={[
            { value: 'sdi', label: 'Senior DI' },
            { value: 'chief_di', label: 'Chief DI' },
            { value: 'first_sgt', label: 'Company 1stSgt' },
          ]}
          fullWidth
        />
        <Input label="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} fullWidth />
        <Button variant="primary" loading={loading} onClick={() => void createCard()}>
          Create card
        </Button>
        {cardId && (
          <>
            <p className="text-sm">Card ID: {cardId}</p>
            <Input label="Append recommendation" value={recommendation} onChange={(e) => setRecommendation(e.target.value)} fullWidth />
            <Button variant="secondary" loading={loading} onClick={() => void appendRecommendationHandler()}>
              Append recommendation
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" loading={loading} onClick={() => void sign('di')}>
                DI sign
              </Button>
              <Button variant="secondary" loading={loading} onClick={() => void sign('senior')}>
                Senior sign
              </Button>
            </div>
          </>
        )}
      </Card>
    </Container>
  );
}
