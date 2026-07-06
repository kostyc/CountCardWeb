import type { TransferBatch } from '@countcard/core/types/models';

export function buildTransferBatchRosterCsv(
  batch: TransferBatch,
  recruits: Array<{ recruitId: string; edipi?: string; firstName: string; lastName: string; rank: string }>
): string {
  const header = 'EDIPI,Last Name,First Name,Rank,Destination Company,Destination Platoon,Pickup Week';
  const rows = recruits.map((r) => {
    const dest = batch.destinationAssignment;
    return [
      r.edipi ?? '',
      r.lastName,
      r.firstName,
      r.rank,
      dest.company ?? '',
      dest.platoon ?? '',
      batch.pickupWeek,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',');
  });
  return [header, ...rows].join('\n');
}
