'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  RECEIVING_CHECKLIST_ITEMS,
  RECEIVING_CHECKLIST_LABELS,
  createDefaultReceivingChecklist,
} from '@countcard/core/constants/receivingChecklist';
import { updateReceivingChecklist } from '@/lib/services/firestore/recruitProgress';
import type { RecruitProfile, ReceivingChecklistEntry } from '@/types/models';
import { useAuth } from '@/context/AuthContext';

interface ReceivingChecklistFormProps {
  recruit: RecruitProfile;
  onUpdated?: () => void;
}

export function ReceivingChecklistForm({
  recruit,
  onUpdated,
}: ReceivingChecklistFormProps): JSX.Element {
  const { user } = useAuth();
  const [checklist, setChecklist] = useState<ReceivingChecklistEntry[]>(
    recruit.receivingChecklist?.length
      ? recruit.receivingChecklist
      : createDefaultReceivingChecklist()
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await updateReceivingChecklist(recruit.recruitId, checklist, user.uid);
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Receiving Medical Checklist</h3>
      <ul className="space-y-3">
        {RECEIVING_CHECKLIST_ITEMS.map((item) => {
          const entry = checklist.find((c) => c.item === item) ?? { item, completed: false };
          return (
            <li key={item} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={entry.completed}
                onChange={(e) => {
                  const completed = e.target.checked;
                  setChecklist((prev) => {
                    const next = prev.filter((c) => c.item !== item);
                    next.push({
                      item,
                      completed,
                      completedAt: completed ? new Date() : undefined,
                      completedBy: completed ? user?.uid : undefined,
                    });
                    return next;
                  });
                }}
                className="h-5 w-5"
              />
              <span>{RECEIVING_CHECKLIST_LABELS[item]}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4">
        <Button variant="primary" onClick={() => void handleSave()} loading={saving}>
          Save checklist
        </Button>
      </div>
    </Card>
  );
}
