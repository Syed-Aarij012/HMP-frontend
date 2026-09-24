"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";

export type SavedSearch = {
  id: number;
  channel: "retail" | "auction";
  query: Record<string, unknown>;
  alert_frequency: "instant" | "daily" | "weekly";
  is_paused: boolean;
  email_alerts: boolean;
  email_consent_at: string | null;
  last_alerted_at: string | null;
  created_at: string;
};

/**
 * FR-B-005: the signed-in user's saved searches, with pause / frequency / email opt-in
 * (which records consent server-side) and delete.
 */
export function useSavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    apiFetch<{ data: SavedSearch[] }>("/saved-searches")
      .then((response) => {
        if (!cancelled) {
          setSearches(response.data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your saved searches.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  const save = useCallback(
    async (query: Record<string, unknown>, options?: { emailAlerts?: boolean; frequency?: SavedSearch["alert_frequency"] }) => {
      try {
        await apiFetch("/saved-searches", {
          method: "POST",
          body: {
            channel: "retail",
            query,
            alert_frequency: options?.frequency ?? "instant",
            email_alerts: options?.emailAlerts ?? false,
          },
        });
        load();
        return null;
      } catch (err) {
        return describeApiError(err, "Could not save this search.");
      }
    },
    [load],
  );

  const update = useCallback(
    async (id: number, changes: Partial<Pick<SavedSearch, "is_paused" | "email_alerts" | "alert_frequency">>) => {
      try {
        const response = await apiFetch<{ data: SavedSearch }>(`/saved-searches/${id}`, { method: "PATCH", body: changes });
        setSearches((current) => current.map((item) => (item.id === id ? response.data : item)));
        return null;
      } catch (err) {
        return describeApiError(err, "Could not update this saved search.");
      }
    },
    [],
  );

  const remove = useCallback(async (id: number) => {
    try {
      await apiFetch(`/saved-searches/${id}`, { method: "DELETE" });
      setSearches((current) => current.filter((item) => item.id !== id));
      return null;
    } catch (err) {
      return describeApiError(err, "Could not delete this saved search.");
    }
  }, []);

  return { searches, loading, error, save, update, remove };
}
