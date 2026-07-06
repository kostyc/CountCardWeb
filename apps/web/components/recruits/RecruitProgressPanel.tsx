'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import {
  listRecruitProgressEvents,
  listRecruitComments,
} from '@/lib/services/firestore/recruitProgress';
import type { RecruitProgressEvent, RecruitComment } from '@/types/models';
import { formatDate, toDate } from '@/lib/utils/datetime';
import { useAuth } from '@/context/AuthContext';

const EVENT_TYPES = [
  { value: 'initial_pft', label: 'Initial PFT' },
  { value: 'initial_cft', label: 'Initial CFT' },
  { value: 'initial_drill', label: 'Initial Drill' },
  { value: 'final_pft', label: 'Final PFT' },
  { value: 'final_cft', label: 'Final CFT' },
  { value: 'final_drill', label: 'Final Drill' },
  { value: 'initial_inspection', label: 'Initial Inspection' },
  { value: 'final_inspection', label: 'Final Inspection' },
  { value: 'bn_co_inspection', label: 'Bn Co Inspection' },
  { value: 'hike', label: 'Hiking' },
  { value: 'general_comment', label: 'General Comment' },
];

interface RecruitProgressPanelProps {
  recruitId: string;
}

export function RecruitProgressPanel({ recruitId }: RecruitProgressPanelProps): JSX.Element {
  const { user } = useAuth();
  const [events, setEvents] = useState<RecruitProgressEvent[]>([]);
  const [comments, setComments] = useState<RecruitComment[]>([]);
  const [eventType, setEventType] = useState('general_comment');
  const [eventNotes, setEventNotes] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const [ev, cm] = await Promise.all([
      listRecruitProgressEvents(recruitId),
      listRecruitComments(recruitId),
    ]);
    setEvents(ev);
    setComments(cm);
  }, [recruitId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function getAuthHeaders(): Promise<HeadersInit> {
    const { auth } = await import('@/lib/firebase/config');
    const token = await auth.currentUser?.getIdToken();
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }

  async function handleAddEvent() {
    if (!user) return;
    setLoading(true);
    try {
      await fetch(`/api/recruits/${recruitId}/progress`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ type: eventType, notes: eventNotes || undefined }),
      });
      setEventNotes('');
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function handleAddComment() {
    if (!user || !commentBody.trim()) return;
    setLoading(true);
    try {
      await fetch(`/api/recruits/${recruitId}/comments`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ body: commentBody, category: 'general' }),
      });
      setCommentBody('');
      await load();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Add Progress Event</h3>
        <div className="space-y-3">
          <Select
            label="Event type"
            options={EVENT_TYPES}
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            fullWidth
          />
          <Input
            label="Notes / scores"
            value={eventNotes}
            onChange={(e) => setEventNotes(e.target.value)}
            fullWidth
          />
          <Button variant="primary" onClick={() => void handleAddEvent()} loading={loading}>
            Record event
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Append Comment</h3>
        <div className="space-y-3">
          <Input
            label="Comment"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            fullWidth
          />
          <Button variant="secondary" onClick={() => void handleAddComment()} loading={loading}>
            Add comment
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Progress Timeline</h3>
        {events.length === 0 ? (
          <p className="text-sm text-gray-500">No progress events recorded.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((ev) => (
              <li key={ev.eventId} className="border-b pb-2">
                <span className="font-medium">{ev.type.replace(/_/g, ' ')}</span>
                <span className="text-sm text-gray-500 ml-2">
                  {formatDate(toDate(ev.recordedAt))}
                </span>
                {ev.notes && <p className="text-sm mt-1">{ev.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Comments</h3>
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.commentId} className="border-b pb-2">
                <span className="text-xs uppercase text-gray-500">{c.category}</span>
                <p className="text-sm mt-1">{c.body}</p>
                <span className="text-xs text-gray-400">{formatDate(toDate(c.createdAt))}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
