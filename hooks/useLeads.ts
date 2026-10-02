"use client";

import { useCallback, useEffect, useState } from "react";
import { hasRole, useAuth } from "@/contexts/AuthContext";
import { apiFetch, describeApiError } from "@/lib/api-client";

export type LeadStatus = "new" | "contacted" | "converted" | "lost";

export type Lead = {
  id: number;
  listing: { id: string; title: string | null; price: string; status: string };
  buyer: { id: number; name: string } | null;
  source: "offer" | "message" | "test_drive" | string | null;
  routed_to: { id: number; name: string } | null;
  status: LeadStatus;
  offer: {
    id: number;
    status: string;
    amount: string;
    part_exchange_appraisal: { trade_in_range: { low: string; high: string } | null; mileage: number } | null;
  } | null;
  conversation_id: number | null;
  created_at: string;
  updated_at: string;
};

type Paginated<T> = { data: T[]; meta: { current_page: number; last_page: number; total: number } };

// Mirrors LeadController::TRANSITIONS — the backend enforces it; this only decides which
// buttons to offer.
export const NEXT_STATUSES: Record<LeadStatus, LeadStatus[]> = {
  new: ["contacted", "converted", "lost"],
  contacted: ["converted", "lost"],
  lost: ["contacted"],
  converted: [],
};

/**
 * FR-C-032: the dealer-facing lead inbox — what LeadRoutingService assigned. An Org Admin
 * sees the whole organization's leads; a salesperson only those routed to them (backend-scoped).
 */
export function useLeads(status: LeadStatus | "all", page: number) {
  const { user } = useAuth();
  const isDealer = typeof user?.organization_id === "number";
  const isOrgAdmin = hasRole(user, "dealer_org_admin");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(isDealer);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!isDealer) {
      setLoading(false);
      return;
    }

    const qs = new URLSearchParams({ page: String(page) });
    if (status !== "all") qs.set("status", status);

    apiFetch<Paginated<Lead>>(`/leads?${qs.toString()}`)
      .then((response) => {
        setLeads(response.data);
        setLastPage(response.meta.last_page);
        setTotal(response.meta.total);
        setError(null);
      })
      .catch((err) => setError(describeApiError(err, "Could not load your leads.")))
      .finally(() => setLoading(false));
  }, [isDealer, status, page]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const updateStatus = useCallback(
    async (leadId: number, next: LeadStatus) => {
      setBusyId(leadId);
      setActionError(null);
      try {
        const response = await apiFetch<{ data: Lead }>(`/leads/${leadId}/status`, { method: "POST", body: { status: next } });
        // Drop it from a filtered view it no longer belongs to; otherwise update in place.
        setLeads((current) =>
          status !== "all" && response.data.status !== status
            ? current.filter((lead) => lead.id !== leadId)
            : current.map((lead) => (lead.id === leadId ? response.data : lead))
        );
      } catch (err) {
        setActionError(describeApiError(err, "Could not update this lead."));
      } finally {
        setBusyId(null);
      }
    },
    [status]
  );

  return { leads, lastPage, total, loading, error, actionError, busyId, updateStatus, isDealer, isOrgAdmin };
}
