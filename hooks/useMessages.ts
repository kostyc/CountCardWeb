'use client';

import { useState, useEffect } from 'react';
import { subscribeMessages } from '@/lib/services/firestore/conversationRealtime';
import type { Message } from '@/types/models';

export interface UseMessagesResult {
  messages: Message[];
  loading: boolean;
  error: Error | null;
}

/**
 * Real-time subscription to messages in a conversation.
 * Unsubscribes on unmount or when conversationId changes.
 */
export function useMessages(conversationId: string | undefined): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeMessages(conversationId, (next) => {
      setMessages(next);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  return { messages, loading, error };
}
