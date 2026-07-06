'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/forms/Input';
import { useAuth } from '@/context/AuthContext';
import {
  acceptTransferBatch,
  listTransferBatches,
  rejectTransferBatch,
} from '@/lib/services/firestore/transferBatches';
import type { TransferBatch } from '@/types/models';

export default function IncomingRecruitsPage(): JSX.Element {
  const { user } = useAuth();
  const [batches, setBatches] = useState<TransferBatch[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user]);

  async function load() {
    const [inTransit, published] = await Promise.all([
      listTransferBatches({ status: 'in_transit' }, { pageSize: 50 }),
      listTransferBatches({ status: 'published' }, { pageSize: 50 }),
    ]);
    setBatches([...inTransit.items, ...published.items]);
  }

  async function accept(id: string) {
    if (!user) return;
    setLoading(true);
    try {
      await acceptTransferBatch(id, user.uid);
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

  return (
    <Container>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Incoming recruits', href: '/company/incoming-recruits' },
        ]}
      />
      <Card className="p-6">
        <h1 className="text-xl font-bold mb-4">Incoming recruit custody</h1>
        {batches.length === 0 ? (
          <p className="text-gray-500">No pending or in-transit batches.</p>
        ) : (
          <ul className="space-y-4">
            {batches.map((b) => (
              <li key={b.transferBatchId} className="border p-4 rounded">
                <p>
                  {b.pickupWeek} — {b.status} — {b.recruitIds.length} recruits
                </p>
                <p className="text-sm text-gray-600">
                  To: {b.destinationAssignment.company} / {b.destinationAssignment.platoon}
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {b.status === 'in_transit' && (
                    <>
                      <Button variant="primary" loading={loading} onClick={() => void accept(b.transferBatchId)}>
                        Accept custody
                      </Button>
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
            ))}
          </ul>
        )}
      </Card>
    </Container>
  );
}
