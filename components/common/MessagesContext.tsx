"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import type { ApiConversation, ApiConversationsResponse } from "@/lib/mapApiConversation";

type MessagesContextValue = {
  conversations: ApiConversation[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  refetch: () => void;
};

const MessagesContext = createContext<MessagesContextValue | null>(null);

// Shared between the dashboard sidebar's unread badge and the Message page's conversation
// list, so reading a thread on one immediately updates the other — two independent
// useConversations() calls would each cache their own stale snapshot instead.
export function useMessages(): MessagesContextValue {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error("useMessages must be used within MessagesProvider");
  }
  return context;
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      queueMicrotask(() => {
        if (!cancelled) {
          setConversations([]);
          setLoading(false);
          setError(null);
        }
      });
      return () => {
        cancelled = true;
      };
    }

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
  }, [user, refetchToken]);

  const unreadCount = conversations.reduce(
    (total, conversation) => total + (conversation.unread_count ?? 0),
    0
  );

  const refetch = useCallback(() => setRefetchToken((t) => t + 1), []);

  return (
    <MessagesContext.Provider
      value={{ conversations, loading, error, unreadCount, refetch }}
    >
      {children}
    </MessagesContext.Provider>
  );
}
