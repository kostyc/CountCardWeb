import { authenticatedFetch } from '@countcard/api-client';

export async function postTransferBatchAction(
  batchId: string,
  action: 'publish' | 'initiate' | 'accept' | 'reject',
  body?: { reason?: string }
): Promise<void> {
  const response = await authenticatedFetch(`/api/transfer-batches/${encodeURIComponent(batchId)}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? `Transfer batch ${action} failed (${response.status})`);
  }
}

export async function createTransferBatch(payload: {
  pickupWeek: string;
  regiment: string;
  destinationAssignment: Record<string, string | undefined>;
  recruitIds: string[];
  notes?: string;
}): Promise<string> {
  const response = await authenticatedFetch('/api/transfer-batches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as { transferBatchId?: string; error?: string };
  if (!response.ok || !data.transferBatchId) {
    throw new Error(data.error ?? `Create batch failed (${response.status})`);
  }
  return data.transferBatchId;
}
