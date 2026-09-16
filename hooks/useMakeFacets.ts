"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { ApiListingsResponse } from "@/lib/mapApiListing";

export type MakeFacet = { value: string; count: number };

export type MakeFacetsResult = {
  makes: MakeFacet[];
  loading: boolean;
  error: string | null;
};

/**
 * Real, live distinct vehicle makes across the retail catalog, with how many live listings
 * each has — the GET /listings facets already computed this over the fully filtered result
 * set, so this is just the make dimension in its original casing ("BMW", not "bmw"), unlike
 * useHomepageListings' makeCounts (lowercased for case-insensitive lookup, so it can't be
 * used as a display label). Used by "Dealerships by Brands" and the dealer directory's own
 * brand filter, since neither is display-driven by a specific page of listings.
 */
export function useMakeFacets(): MakeFacetsResult {
  const [makes, setMakes] = useState<MakeFacet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiListingsResponse>("/listings?per_page=1", { auth: false })
      .then((response) => {
        if (!cancelled) setMakes(response.facets?.make ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load brands from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { makes, loading, error };
}
