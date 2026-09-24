"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { mapApiMyProxyBid, type ApiListResponse, type ApiMyProxyBid } from "@/lib/mapApiAuction";
import type { MyProxyBid } from "@/types/auction";

export function useMyProxyBids() {
  const [proxyBids, setProxyBids] = useState<MyProxyBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiListResponse<ApiMyProxyBid>>("/my-proxy-bids")
      .then((response) => {
        if (!cancelled) setProxyBids(response.data.map(mapApiMyProxyBid));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your proxy bids from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { proxyBids, loading, error };
}
