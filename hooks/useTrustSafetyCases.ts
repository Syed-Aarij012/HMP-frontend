"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";

export type TrustSafetyStatus = "open" | "dismissed" | "actioned";

type ReportedUser = { id: number; name: string; email: string; status: string } | null;

export type TrustSafetyCaseSummary = {
  id: number;
  reason: string;
  severity: "high" | "medium" | "low";
  status: TrustSafetyStatus;
  conversation_id: number;
  message_body: string | null;
  reported_user: ReportedUser;
  resolution_note: string | null;
  created_at: string;
};

export type TrustSafetyCaseDetail = Omit<TrustSafetyCaseSummary, "message_body" | "conversation_id"> & {
  resolved_at: string | null;
  flagged_message_id: number;
  conversation: {
    id: number;
    listing_title: string | null;
    listing_id: string | null;
    buyer: { id: number; name: string } | null;
    seller: { id: number; name: string } | null;
    messages: {
      id: number;
      sender: { id: number; name: string } | null;
      body: string;
      attachment_count: number;
      flagged: boolean;
      flagged_reason: string | null;
      created_at: string;
    }[];
  } | null;
};

type Paginated<T> = { data: T[]; current_page: number; last_page: number; total: number };

export type ResolveInput = { resolution: "dismissed" | "actioned"; note: string; suspendUser: boolean };

/**
 * FR-C-031: the Trust & Safety queue of messages the PII/off-platform-payment detector
 * flagged — highest severity first (the backend's ordering), filterable by status.
 */
export function useTrustSafetyCases(status: TrustSafetyStatus | "all", page: number) {
  const [cases, setCases] = useState<TrustSafetyCaseSummary[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    const qs = new URLSearchParams({ page: String(page) });
    if (status !== "all") qs.set("status", status);

    apiFetch<Paginated<TrustSafetyCaseSummary>>(`/trust-safety/cases?${qs.toString()}`)
      .then((response) => {
        setCases(response.data);
        setLastPage(response.last_page);
        setTotal(response.total);
        setError(null);
      })
      .catch((err) => setError(describeApiError(err, "Could not load the Trust & Safety queue.")))
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  return { cases, lastPage, total, loading, error, reload: load };
}

/** One case with the full conversation thread around the flagged message, plus resolving it. */
export function useTrustSafetyCase(caseId: number | null, onResolved: () => void) {
  const [detail, setDetail] = useState<TrustSafetyCaseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setDetail(null);
      setError(null);
      setLoading(caseId !== null);
    });
    if (caseId === null) {
      return () => {
        cancelled = true;
      };
    }

    apiFetch<{ data: TrustSafetyCaseDetail }>(`/trust-safety/cases/${caseId}`)
      .then((response) => !cancelled && setDetail(response.data))
      .catch((err) => !cancelled && setError(describeApiError(err, "Could not load this case.")))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const resolve = useCallback(
    async (input: ResolveInput): Promise<boolean> => {
      if (caseId === null) return false;
      setResolving(true);
      setError(null);
      try {
        await apiFetch(`/trust-safety/cases/${caseId}/resolve`, {
          method: "POST",
          body: {
            resolution: input.resolution,
            note: input.note.trim() || undefined,
            suspend_user: input.resolution === "actioned" && input.suspendUser,
          },
        });
        const refreshed = await apiFetch<{ data: TrustSafetyCaseDetail }>(`/trust-safety/cases/${caseId}`);
        setDetail(refreshed.data);
        onResolved();
        return true;
      } catch (err) {
        setError(describeApiError(err, "Could not resolve this case."));
        return false;
      } finally {
        setResolving(false);
      }
    },
    [caseId, onResolved]
  );

  return { detail, loading, error, resolving, resolve };
}
