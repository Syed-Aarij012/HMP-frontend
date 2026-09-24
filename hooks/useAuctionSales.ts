"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { mapApiSale, type ApiAuctionSale, type ApiListResponse } from "@/lib/mapApiAuction";
import type { AuctionSale } from "@/types/auction";

export function useAuctionSales() {
  const [sales, setSales] = useState<AuctionSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiListResponse<ApiAuctionSale>>("/auction/sales")
      .then((response) => {
        if (!cancelled) setSales(response.data.map(mapApiSale));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load auction sales from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { sales, loading, error };
}
