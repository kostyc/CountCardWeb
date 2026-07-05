'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/forms/Input';
import {
  OrganizationalAssignment,
  type OrganizationalAssignmentValue,
  type OrganizationalAssignmentErrors,
} from './OrganizationalAssignment';
import type { RecruitProfile } from '@/types/models';

export interface RecruitTransferFormData {
  regiment?: string;
  battalion?: string;
  company?: string;
  series?: string;
  platoon: string;
  reason?: string;
}

export interface RecruitTransferFormProps {
  recruit: RecruitProfile;
  onSubmit: (data: RecruitTransferFormData) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
}

function formatAssignment(recruit: RecruitProfile): string {
  return [
    recruit.regiment,
    recruit.battalion,
    recruit.company,
    recruit.series,
    recruit.platoon ? `Platoon ${recruit.platoon}` : undefined,
  ]
    .filter(Boolean)
    .join(' / ');
}

export function RecruitTransferForm({
  recruit,
  onSubmit,
  onCancel,
  loading = false,
  error,
}: RecruitTransferFormProps): JSX.Element {
  const [assignment, setAssignment] = useState<OrganizationalAssignmentValue>({
    regiment: recruit.regiment,
    battalion: recruit.battalion,
    company: recruit.company,
    series: recruit.series,
    platoon: recruit.platoon,
  });
  const [reason, setReason] = useState('');
  const [orgErrors, setOrgErrors] = useState<OrganizationalAssignmentErrors>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assignment.platoon?.trim()) {
      setOrgErrors({ platoon: 'Platoon is required' });
      return;
    }
    setOrgErrors({});
    await onSubmit({
      regiment: assignment.regiment,
      battalion: assignment.battalion,
      company: assignment.company,
      series: assignment.series,
      platoon: assignment.platoon.trim(),
      reason: reason.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark mb-2">
          Transfer Recruit
        </h2>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
          {recruit.lastName}, {recruit.firstName} — move to a new organizational assignment and mark as transferred.
        </p>
        <div className="rounded-lg bg-background-secondary-light dark:bg-background-secondary-dark p-4 mb-6">
          <p className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
            Current assignment
          </p>
          <p className="text-base text-text-primary-light dark:text-text-primary-dark mt-1">
            {formatAssignment(recruit)}
          </p>
        </div>
        <OrganizationalAssignment
          value={assignment}
          onChange={setAssignment}
          errors={orgErrors}
        />
        <div className="mt-4">
          <Input
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Reassigned to follow series"
            fullWidth
          />
        </div>
        {error ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </Card>
      <div className="flex flex-wrap gap-3 justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          Transfer Recruit
        </Button>
      </div>
    </form>
  );
}
