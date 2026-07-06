'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/forms/Input';
import { useAuth } from '@/context/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import {
  acceptTransferBatch,
  advanceCdiReview,
  advanceFirstSgtReview,
  listTransferBatches,
  rejectTransferBatch,
} from '@/lib/services/firestore/transferBatches';
import type { TransferBatch } from '@/types/models';
import type { TransferBatchStatus } from '@countcard/core/validation/lifecycleSchemas';

const REVIEW_STATUSES: TransferBatchStatus[] = [
  'published',
  'first_sgt_review',
  'cdi_review',
  'sdi_accept',
];

function stageActionLabel(status: TransferBatchStatus): string | null {
  switch (status) {
    case 'first_sgt_review':
      return 'Complete 1st Sgt review';
    case 'cdi_review':
      return 'Complete CDI review';
    case 'sdi_accept':
      return 'Accept custody (SDI)';
    default:
      return null;
  }
}

export default function IncomingRecruitsPage(): JSX.Element {
  const { user } = useAuth();
  const { isFullAdmin, canIncomingCustody } = useAdminAccess();
  const role = user?.customClaims?.role ?? user?.profile?.role;
  const [batches, setBatches] = useState<TransferBatch[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user]);

  async function load() {
    const results = await Promise.all(
      REVIEW_STATUSES.map((status) => listTransferBatches({ status }, { pageSize: 50 }))
    );
    setBatches(results.flatMap((r) => r.items));
  }

  function canActOnBatch(batch: TransferBatch): boolean {
    if (isFullAdmin) return true;
    switch (batch.status) {
      case 'first_sgt_review':
        return role === 'company_first_sgt';
      case 'cdi_review':
        return role === 'chief_drill_instructor';
      case 'sdi_accept':
        return role === 'senior_drill_instructor';
      default:
        return false;
    }
  }

  async function advance(batch: TransferBatch) {
    if (!user) return;
    setLoading(true);
    try {
      if (batch.status === 'first_sgt_review') {
        await advanceFirstSgtReview(batch.transferBatchId, user.uid);
      } else if (batch.status === 'cdi_review') {
        await advanceCdiReview(batch.transferBatchId, user.uid);
      } else if (batch.status === 'sdi_accept') {
        await acceptTransferBatch(batch.transferBatchId, user.uid);
      }
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function reject(id: string) {
    if (!user) return;
    setLoading(true);
    try {
      await rejectTransferBatch(id, user.uid, rejectReason);
      await load();
    } finally {
      setLoading(false);
    }
  }

  if (!canIncomingCustody && !isFullAdmin) {
    return (
      <Container>
        <Card className="p-6">
          <p className="text-gray-500">Company custody access required.</p>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Incoming recruits', href: '/company/incoming-recruits' },
        ]}
      />
      <Card className="p-6">
        <h1 className="text-xl font-bold mb-2">Incoming recruit custody</h1>
        <p className="text-sm text-gray-600 mb-4">
          Staged review: 1st Sgt → CDI → SDI accept. Reject returns recruits to receiving-ready.
        </p>
        {batches.length === 0 ? (
          <p className="text-gray-500">No batches awaiting company review.</p>
        ) : (
          <ul className="space-y-4">
            {batches.map((b) => {
              const actionLabel = stageActionLabel(b.status);
              const showAction = actionLabel && canActOnBatch(b);
              const showReject = ['first_sgt_review', 'cdi_review', 'sdi_accept', 'published'].includes(
                b.status
              );
              return (
                <li key={b.transferBatchId} className="border p-4 rounded">
                  <p>
                    {b.pickupWeek} — <strong>{b.status}</strong> — {b.recruitIds.length} recruits
                  </p>
                  <p className="text-sm text-gray-600">
                    To: {b.destinationAssignment.company} / {b.destinationAssignment.platoon}
                  </p>
                  {b.workflowHistory && b.workflowHistory.length > 0 && (
                    <ul className="text-xs text-gray-500 mt-2 space-y-0.5">
                      {b.workflowHistory.map((h, i) => (
                        <li key={i}>{h.action}</li>
                      ))}
                    </ul>
                  )}
                  <div className="flex gap-2 mt-2 flex-wrap items-end">
                    {showAction && (
                      <Button variant="primary" loading={loading} onClick={() => void advance(b)}>
                        {actionLabel}
                      </Button>
                    )}
                    {showReject && (
                      <>
                        <Input
                          label="Reject reason"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <Button variant="secondary" loading={loading} onClick={() => void reject(b.transferBatchId)}>
                          Reject
                        </Button>
                      </>
                    )}
                    <Link href={`/receiving/transfers/${b.transferBatchId}`} className="text-sm underline">
                      View batch
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </Container>
  );
}
