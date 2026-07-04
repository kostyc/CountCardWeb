'use client';

import { useState, useEffect } from 'react';
import { subscribeConversationsForUser } from '@countcard/firebase/services/conversationRealtime';
import type { Conversation } from '@countcard/core/types/models';

export interface UseConversationsResult {
  conversations: Conversation[];
  loading: boolean;
  error: Error | null;
}

/**
 * Real-time subscription to conversations for the given user.
 * Unsubscribes on unmount or when userId changes.
 */
export function useConversations(userId: string | undefined): UseConversationsResult {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeConversationsForUser(userId, (next) => {
      setConversations(next);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return { conversations, loading, error };
}
