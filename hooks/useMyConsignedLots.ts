"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { mapApiLot, type ApiAuctionLot, type ApiListResponse } from "@/lib/mapApiAuction";
import type { AuctionLot } from "@/types/auction";

export function useMyConsignedLots() {
  const [lots, setLots] = useState<AuctionLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    apiFetch<ApiListResponse<ApiAuctionLot>>("/auction/my-lots")
      .then((response) => {
        if (!cancelled) {
          setLots(response.data.map(mapApiLot));
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your consigned vehicles from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  return { lots, loading, error, reload: load };
}
