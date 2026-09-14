"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { mapApiAgentToAgent, type ApiAgentsResponse } from "@/lib/mapApiAgent";
import type { Agent } from "@/types/agents";

export type AgentsResult = {
  agents: Agent[];
  loading: boolean;
  error: string | null;
};

/**
 * The public, anonymous-browsing GET /agents directory (FR-C-002) — dealer org admins and
 * sales staff. Fetched as one page (agent counts are small), same as useDealers.
 */
export function useAgents(perPage = 100): AgentsResult {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiAgentsResponse>(`/agents?per_page=${perPage}`, { auth: false })
      .then((response) => {
        if (!cancelled) setAgents(response.data.map(mapApiAgentToAgent));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load sale agents from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [perPage]);

  return { agents, loading, error };
}
