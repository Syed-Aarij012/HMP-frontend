"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { mapApiDealerToDealer, type ApiDealersResponse } from "@/lib/mapApiDealer";
import type { Dealer } from "@/types/dealers";

export type DealersResult = {
  dealers: Dealer[];
  loading: boolean;
  error: string | null;
};

type UseDealersOptions = {
  perPage?: number;
  // "Dealerships by Brands" (FR-C-002): scopes to dealers with a live listing of this make.
  make?: string;
};

/**
 * The public, anonymous-browsing GET /dealers endpoint (FR-C-002) — fetched as one page
 * (dealer counts are small) so the existing client-side filter/sort/paginate helpers in
 * lib/dealerListingUtils.ts keep working unchanged against a real Dealer[] array.
 */
export function useDealers({ perPage = 100, make }: UseDealersOptions = {}): DealersResult {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    const params = new URLSearchParams({ per_page: String(perPage) });
    if (make) params.set("make", make);

    apiFetch<ApiDealersResponse>(`/dealers?${params.toString()}`, { auth: false })
      .then((response) => {
        if (!cancelled) setDealers(response.data.map(mapApiDealerToDealer));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load dealers from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [perPage, make]);

  return { dealers, loading, error };
}
