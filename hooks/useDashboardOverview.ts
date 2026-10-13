"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import type { DashboardOverview, DashboardRangeKey } from "@/types/dashboardOverview";

export type RangeSelection = { key: DashboardRangeKey; from?: string; to?: string };

/**
 * The signed-in account's role dashboard for a reporting window. While a new window loads the
 * previous data stays on screen (marked busy), so the layout never jumps.
 */
export function useDashboardOverview(selection: RangeSelection) {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const query = new URLSearchParams({ range: selection.key });
  if (selection.key === "custom" && selection.from && selection.to) {
    query.set("from", selection.from);
    query.set("to", selection.to);
  }
  const path = `/dashboard/overview?${query.toString()}`;

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      apiFetch<{ data: DashboardOverview }>(path)
        .then((response) => {
          if (!cancelled) setData(response.data);
        })
        .catch((err) => {
          if (!cancelled) setError(describeApiError(err, "Could not load your dashboard."));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [path, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { data, loading, error, retry };
}
