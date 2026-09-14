"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { ApiConversation, ApiConversationsResponse } from "@/lib/mapApiConversation";

export type ConversationsResult = {
  conversations: ApiConversation[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

/** FR-C-031: every message thread the signed-in user is a party to. */
export function useConversations(): ConversationsResult {
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    apiFetch<ApiConversationsResponse>("/conversations")
      .then((response) => {
        if (!cancelled) setConversations(response.data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your messages from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refetchToken]);

  return {
    conversations,
    loading,
    error,
    refetch: () => setRefetchToken((t) => t + 1),
  };
}
