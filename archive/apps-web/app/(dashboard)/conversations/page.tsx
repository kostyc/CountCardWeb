'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { Select } from '@/components/forms/Select';
import { createOrgChannelConversation } from '@/lib/services/firestore/conversations';

export default function ConversationsPage(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { conversations, loading } = useConversations(user?.uid);
  const [channelType, setChannelType] = useState<
    'platoon_channel' | 'company_channel' | 'battalion_broadcast'
  >('company_channel');
  const [creating, setCreating] = useState(false);

  async function createChannel() {
    const org = user?.customClaims?.organizationalAssignment;
    if (!org?.regiment || !user) return;
    setCreating(true);
    try {
      const conversationId = await createOrgChannelConversation({
        conversationType: channelType,
        organizationalScope: {
          regiment: org.regiment,
          battalion: org.battalion,
          company: org.company,
          platoon: org.platoon,
          series: org.series,
        },
        createdBy: user.uid,
        title: `${channelType} channel`,
      });
      router.push(`/conversations/${conversationId}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Container>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Messages', href: '/conversations' },
        ]}
      />
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Create org channel</h2>
        <Select
          label="Channel type"
          value={channelType}
          onChange={(e) =>
            setChannelType(
              e.target.value as 'platoon_channel' | 'company_channel' | 'battalion_broadcast'
            )
          }
          options={[
            { value: 'platoon_channel', label: 'Platoon channel' },
            { value: 'company_channel', label: 'Company channel' },
            { value: 'battalion_broadcast', label: 'Battalion broadcast' },
          ]}
          fullWidth
        />
        <Button variant="primary" className="mt-3" loading={creating} onClick={() => void createChannel()}>
          Create channel
        </Button>
      </Card>
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Conversations</h2>
        {loading ? (
          <p>Loading…</p>
        ) : conversations.length === 0 ? (
          <p className="text-gray-500">No conversations yet.</p>
        ) : (
          <ul className="space-y-2">
            {conversations.map((c) => (
              <li key={c.conversationId}>
                <Link href={`/conversations/${c.conversationId}`} className="text-[#001e2e] underline">
                  {String(c.metadata?.title ?? c.conversationId)}
                  {c.lastMessageContent ? ` — ${c.lastMessageContent}` : ''}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Container>
  );
}
