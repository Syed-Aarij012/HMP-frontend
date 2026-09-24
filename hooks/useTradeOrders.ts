"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { mapApiTradeOrder, type ApiListResponse, type ApiTradeOrder } from "@/lib/mapApiAuction";
import type { TradeOrder } from "@/types/auction";

export function useTradeOrders() {
  const [tradeOrders, setTradeOrders] = useState<TradeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiListResponse<ApiTradeOrder>>("/my-trade-orders")
      .then((response) => {
        if (!cancelled) setTradeOrders(response.data.map(mapApiTradeOrder));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your trade orders from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { tradeOrders, loading, error };
}
