"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { mapApiListingToCar, type ApiListingsResponse } from "@/lib/mapApiListing";
import type { Car } from "@/types/cars";

export type FilteredListingsResult = {
  cars: Car[];
  loading: boolean;
  error: string | null;
};

type FilteredListingsParams = {
  // GET /listings?organization_id={id} — one dealer's inventory (DealerInventorySlider).
  organizationId?: number;
  // GET /listings?seller_user_id={id} — one agent's own listings (SaleAgentListingsPanel).
  sellerUserId?: number;
  perPage?: number;
};

/**
 * The same public, anonymous-browsing GET /listings endpoint hooks/useHomepageListings.ts
 * uses, scoped down to one organization's or one seller's listings instead of the whole
 * catalog. Skips the request entirely when neither filter id is set (e.g. a mock dealer/
 * agent with no real organizationId/isReal id to scope by).
 */
export function useFilteredListings({
  organizationId,
  sellerUserId,
  perPage = 50,
}: FilteredListingsParams): FilteredListingsResult {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(Boolean(organizationId || sellerUserId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!organizationId && !sellerUserId) {
      queueMicrotask(() => {
        if (!cancelled) {
          setCars([]);
          setLoading(false);
          setError(null);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });

    const params = new URLSearchParams({ per_page: String(perPage) });
    if (organizationId) params.set("organization_id", String(organizationId));
    if (sellerUserId) params.set("seller_user_id", String(sellerUserId));

    apiFetch<ApiListingsResponse>(`/listings?${params.toString()}`, { auth: false })
      .then((response) => {
        if (!cancelled) setCars(response.data.map(mapApiListingToCar));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load listings from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId, sellerUserId, perPage]);

  return { cars, loading, error };
}
