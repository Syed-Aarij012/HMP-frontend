"use client";

import { useCallback, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiTradeFixedPriceListing, type ApiTradeFixedPriceListing } from "@/lib/mapApiTradeFixedPrice";
import type { TradeFixedPriceListing } from "@/types/tradeFixedPrice";

export function useBuyTradeFixedPriceListing() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = useCallback(async (listingId: string): Promise<TradeFixedPriceListing> => {
    setError(null);
    setSubmitting(true);

    try {
      const response = await apiFetch<{ data: ApiTradeFixedPriceListing }>(
        `/trade/fixed-price-listings/${listingId}/buy`,
        { method: "POST" },
      );

      return mapApiTradeFixedPriceListing(response.data);
    } catch (err) {
      setError(describeApiError(err, "Could not complete this purchase right now."));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { buy, submitting, error };
}
