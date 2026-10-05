"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import type { Paginated } from "@/lib/superAdmin";

export type GroupDealership = {
  id: number;
  name: string;
  status: string;
  kyb_status: string;
  rooftops_count: number;
  staff_count: number;
  live_ads_count: number;
  awaiting_review_count: number;
  storefront_slug: string | null;
  org_admins: { id: number; name: string; email: string; status: string }[];
};

export type GroupOverview = {
  group: { id: number; name: string };
  totals: { dealerships: number; staff: number; rooftops: number; live_ads: number; awaiting_review: number };
  dealerships: GroupDealership[];
};

export type GroupAd = {
  id: string;
  title: string;
  vrm: string | null;
  price: string;
  status: string;
  dealership: string | null;
  organization_id: number;
  rooftop: string | null;
};

type Result = { ok: true } | { ok: false; message: string };

/**
 * REQ RBAC-003: a Group Admin's view of their dealer group — dealerships, group-wide ads, opening
 * a dealership, appointing an Org Admin. The API confines everything to the admin's own group.
 */
export function useDealerGroup() {
  const [overview, setOverview] = useState<GroupOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setOverview((await apiFetch<{ data: GroupOverview }>("/dealer-group")).data);
      setError(null);
    } catch (err) {
      setError(describeApiError(err, "Could not load your dealer group."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const run = useCallback(
    async (path: string, body: Record<string, unknown>, fallback: string): Promise<Result> => {
      try {
        await apiFetch(path, { method: "POST", body });
        await load();
        return { ok: true };
      } catch (err) {
        return { ok: false, message: describeApiError(err, fallback) };
      }
    },
    [load],
  );

  return {
    overview,
    loading,
    error,
    openDealership: (body: Record<string, unknown>) => run("/dealer-group/dealerships", body, "Could not open that dealership."),
    appointAdmin: (organizationId: number, body: Record<string, unknown>) =>
      run(`/dealer-group/dealerships/${organizationId}/admins`, body, "Could not appoint that Org Admin."),
  };
}

export function useGroupAds(organizationId: string, status: string, q: string, page: number) {
  const [ads, setAds] = useState<Paginated<GroupAd> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const qs = new URLSearchParams({ page: String(page) });
    if (organizationId) qs.set("organization_id", organizationId);
    if (status) qs.set("status", status);
    if (q) qs.set("q", q);
    queueMicrotask(() => !cancelled && setLoading(true));
    apiFetch<Paginated<GroupAd>>(`/dealer-group/listings?${qs.toString()}`)
      .then((response) => !cancelled && (setAds(response), setError(null)))
      .catch((err) => !cancelled && setError(describeApiError(err, "Could not load the group's ads.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [organizationId, status, q, page]);

  return { ads, loading, error };
}
