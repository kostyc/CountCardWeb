'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/forms/Input';
import { OrganizationalAssignment, type OrganizationalAssignmentValue } from '@/components/recruits/OrganizationalAssignment';
import { listRecruits } from '@/lib/services/firestore/recruits';
import {
  createTransferBatch,
  listTransferBatches,
} from '@/lib/services/firestore/transferBatches';
import type { RecruitProfile } from '@/types/models';
import type { TransferBatch } from '@/types/models';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function ReceivingTransfersPage(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [recruits, setRecruits] = useState<RecruitProfile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pickupWeek, setPickupWeek] = useState('');
  const [destination, setDestination] = useState<OrganizationalAssignmentValue>({ regiment: 'West' });
  const [batches, setBatches] = useState<TransferBatch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    void listRecruits({ custodyPhase: 'receiving_ready' }, { pageSize: 100 }).then((r) =>
      setRecruits(r.items)
    );
    void loadBatches();
  }, [user]);

  async function loadBatches() {
    const result = await listTransferBatches(undefined, { pageSize: 50 });
    setBatches(result.items);
  }

  async function createBatch() {
    if (!user || selected.size === 0 || !destination.platoon) return;
    setLoading(true);
    try {
      const batchId = `tb-${Date.now()}`;
      await createTransferBatch(batchId, {
        pickupWeek: pickupWeek || `Week-${new Date().toISOString().slice(0, 10)}`,
        regiment: destination.regiment ?? 'West',
        destinationAssignment: destination,
        recruitIds: Array.from(selected),
        createdBy: user.uid,
      });
      router.push(`/receiving/transfers/${batchId}`);
    } catch (err) {
      showToast({
        variant: 'error',
        message: err instanceof Error ? err.message : 'Failed to create transfer batch',
      });
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Container>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Receiving Transfers', href: '/receiving/transfers' },
          ]}
        />
        <div className="flex gap-3 flex-wrap">
          <Link href="/receiving/intake">
            <Button variant="primary">Add recruit at Receiving</Button>
          </Link>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Create transfer batch</h2>
          <Input label="Pickup week" value={pickupWeek} onChange={(e) => setPickupWeek(e.target.value)} fullWidth />
          <div className="my-4">
            <OrganizationalAssignment value={destination} onChange={setDestination} required />
          </div>
          <h3 className="font-medium mb-2">Ready recruits ({selected.size} selected)</h3>
          <ul className="max-h-64 overflow-y-auto space-y-2 mb-4">
            {recruits.map((r) => (
              <li key={r.recruitId}>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={selected.has(r.recruitId)} onChange={() => toggle(r.recruitId)} />
                  {r.lastName}, {r.firstName} ({r.edipi ?? r.recruitId})
                </label>
              </li>
            ))}
          </ul>
          <Button variant="primary" onClick={() => void createBatch()} loading={loading}>
            Create draft batch
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Transfer batches</h2>
          <ul className="space-y-2">
            {batches.map((b) => (
              <li key={b.transferBatchId}>
                <Link href={`/receiving/transfers/${b.transferBatchId}`} className="text-[#001e2e] underline">
                  {b.pickupWeek} — {b.status} ({b.transferBatchId})
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Container>
  );
}
