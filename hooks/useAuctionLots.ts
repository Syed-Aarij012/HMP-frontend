"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { mapApiLot, type ApiAuctionLot, type ApiListResponse } from "@/lib/mapApiAuction";
import type { AuctionLot } from "@/types/auction";

/**
 * FR-B-001: the trade-only auction catalog. §2.3 restricts this to trade buyers/dealers —
 * a private buyer's token gets a 403 here, surfaced as `error` rather than an empty list.
 */
export function useAuctionLots(statusFilter?: string) {
  const [lots, setLots] = useState<AuctionLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";

    apiFetch<ApiListResponse<ApiAuctionLot>>(`/auction/lots${query}`)
      .then((response) => {
        if (!cancelled) {
          setLots(response.data.map(mapApiLot));
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the auction catalog from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  return { lots, loading, error };
}
