"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { ApiListResponse } from "@/lib/mapApiAuction";
import { mapApiTradeFixedPriceListing, type ApiTradeFixedPriceListing } from "@/lib/mapApiTradeFixedPrice";
import type { TradeFixedPriceListing } from "@/types/tradeFixedPrice";

/**
 * FR-A-030 (M): browses the active Fixed-Price Trade ("Buy Now") listings — the trade-buyer
 * equivalent of /auction, no bidding, no run order.
 */
export function useTradeFixedPriceListings() {
  const [listings, setListings] = useState<TradeFixedPriceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    apiFetch<ApiListResponse<ApiTradeFixedPriceListing>>("/trade/fixed-price-listings")
      .then((response) => {
        if (!cancelled) {
          setListings(response.data.map(mapApiTradeFixedPriceListing));
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load fixed-price listings from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  return { listings, loading, error, reload: load };
}
