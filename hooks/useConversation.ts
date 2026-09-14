"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { ApiConversation } from "@/lib/mapApiConversation";

export type ConversationResult = {
  conversation: ApiConversation | null;
  loading: boolean;
  error: string | null;
  sending: boolean;
  sendMessage: (body: string) => Promise<void>;
};

/** FR-C-031: one conversation's full message history, plus a way to reply to it. */
export function useConversation(conversationId: number | null): ConversationResult {
  const [conversation, setConversation] = useState<ApiConversation | null>(null);
  const [loading, setLoading] = useState(Boolean(conversationId));
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!conversationId) {
      queueMicrotask(() => {
        if (!cancelled) {
          setConversation(null);
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    apiFetch<{ data: ApiConversation }>(`/conversations/${conversationId}`)
      .then((response) => {
        if (!cancelled) setConversation(response.data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this conversation from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!conversationId) return;

      setSending(true);
      try {
        const response = await apiFetch<{ data: ApiConversation }>(
          `/conversations/${conversationId}/messages`,
          { method: "POST", body: { body } }
        );
        setConversation(response.data);
      } finally {
        setSending(false);
      }
    },
    [conversationId]
  );

  return { conversation, loading, error, sending, sendMessage };
}
