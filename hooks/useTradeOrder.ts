"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiTradeOrder, type ApiTradeOrder } from "@/lib/mapApiAuction";
import type { TradeOrder } from "@/types/auction";

export function useTradeOrder(id: number | undefined) {
  const [tradeOrder, setTradeOrder] = useState<TradeOrder | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    apiFetch<{ data: ApiTradeOrder }>(`/trade-orders/${id}`)
      .then((response) => {
        if (!cancelled) {
          setTradeOrder(mapApiTradeOrder(response.data));
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this trade order from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => load(), [load]);

  const pay = useCallback(async () => {
    if (!id) return;
    setPayError(null);
    setPaying(true);
    try {
      await apiFetch(`/trade-orders/${id}/pay`, { method: "POST" });
      load();
    } catch (err) {
      setPayError(describeApiError(err, "Could not pay this invoice right now."));
      throw err;
    } finally {
      setPaying(false);
    }
  }, [id, load]);

  return { tradeOrder, loading, error, payError, paying, pay };
}
