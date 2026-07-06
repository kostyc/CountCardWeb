'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/forms/Input';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { sendMessage } from '@/lib/services/firestore/conversations';

export default function ConversationThreadPage(): JSX.Element {
  const params = useParams();
  const conversationId = params?.conversationId as string;
  const { user } = useAuth();
  const { messages, loading } = useMessages(conversationId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!user || !text.trim()) return;
    setSending(true);
    try {
      await sendMessage(
        conversationId,
        `msg-${Date.now()}`,
        {
          messageId: `msg-${Date.now()}`,
          conversationId,
          senderId: user.uid,
          content: text.trim(),
        },
        user.uid
      );
      setText('');
    } finally {
      setSending(false);
    }
  }

  return (
    <Container>
      <Breadcrumbs
        items={[
          { label: 'Messages', href: '/conversations' },
          { label: conversationId, href: `/conversations/${conversationId}` },
        ]}
      />
      <Card className="p-6">
        <div className="min-h-[300px] space-y-3 mb-4">
          {loading ? (
            <p>Loading…</p>
          ) : (
            messages.map((m) => (
              <div key={m.messageId} className="border-b pb-2">
                <span className="text-xs text-gray-500">{m.senderId}</span>
                <p>{m.content}</p>
              </div>
            ))
          )}
        </div>
        <Input label="Message" value={text} onChange={(e) => setText(e.target.value)} fullWidth />
        <Button variant="primary" className="mt-3" loading={sending} onClick={() => void handleSend()}>
          Send
        </Button>
      </Card>
    </Container>
  );
}
