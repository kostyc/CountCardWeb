'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import {
  buildTransferBatchRosterCsv,
  getTransferBatchById,
  initiateTransferBatch,
  publishTransferBatch,
} from '@/lib/services/firestore/transferBatches';
import { getRecruitProfileById } from '@/lib/services/firestore/recruits';
import type { TransferBatch } from '@/types/models';

export default function TransferBatchDetailPage(): JSX.Element {
  const params = useParams();
  const batchId = params?.id as string;
  const { user } = useAuth();
  const [batch, setBatch] = useState<TransferBatch | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !batchId) return;
    void loadBatch();
  }, [user, batchId]);

  async function loadBatch() {
    const data = await getTransferBatchById(batchId);
    setBatch(data);
  }

  async function exportCsv() {
    if (!batch) return;
    setLoading(true);
    try {
      const recruits = await Promise.all(
        batch.recruitIds.map(async (id) => {
          const r = await getRecruitProfileById(id);
          if (!r) throw new Error(`Recruit not found: ${id}`);
          return r;
        })
      );
      const csv = buildTransferBatchRosterCsv(batch, recruits);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roster-${batchId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  async function runAction(action: 'publish' | 'initiate') {
    if (!user) return;
    setLoading(true);
    try {
      if (action === 'publish') {
        await publishTransferBatch(batchId, user.uid);
      } else {
        await initiateTransferBatch(batchId, user.uid);
      }
      await loadBatch();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container>
      <Breadcrumbs
        items={[
          { label: 'Receiving', href: '/receiving/transfers' },
          { label: batchId, href: `/receiving/transfers/${batchId}` },
        ]}
      />
      {batch && (
        <Card className="p-6 space-y-4">
          <h1 className="text-xl font-bold">Transfer batch — {batch.pickupWeek}</h1>
          <p>Status: {batch.status}</p>
          <p>
            Destination: {batch.destinationAssignment.company} / {batch.destinationAssignment.platoon}
          </p>
          <p>Recruits: {batch.recruitIds.length}</p>
          <div className="flex flex-wrap gap-2">
            {batch.status === 'draft' && (
              <Button variant="primary" loading={loading} onClick={() => void runAction('publish')}>
                Publish roster
              </Button>
            )}
            {batch.status === 'published' && (
              <>
                <Button variant="primary" loading={loading} onClick={() => void runAction('initiate')}>
                  Initiate (Friday march)
                </Button>
                <Button variant="secondary" type="button" loading={loading} onClick={() => void exportCsv()}>
                  Export CSV
                </Button>
              </>
            )}
          </div>
          {batch.workflowHistory && (
            <ul className="text-sm space-y-1">
              {batch.workflowHistory.map((h, i) => (
                <li key={i}>
                  {h.action} — {String(h.timestamp)}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </Container>
  );
}
