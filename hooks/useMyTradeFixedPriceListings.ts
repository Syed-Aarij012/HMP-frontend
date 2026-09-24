"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { ApiListResponse } from "@/lib/mapApiAuction";
import { mapApiTradeFixedPriceListing, type ApiTradeFixedPriceListing } from "@/lib/mapApiTradeFixedPrice";
import type { TradeFixedPriceListing } from "@/types/tradeFixedPrice";

export function useMyTradeFixedPriceListings() {
  const [listings, setListings] = useState<TradeFixedPriceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    apiFetch<ApiListResponse<ApiTradeFixedPriceListing>>("/trade/my-fixed-price-listings")
      .then((response) => {
        if (!cancelled) {
          setListings(response.data.map(mapApiTradeFixedPriceListing));
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your fixed-price listings from the server.");
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
