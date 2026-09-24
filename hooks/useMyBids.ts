"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { mapApiMyBid, type ApiListResponse, type ApiMyBid } from "@/lib/mapApiAuction";
import type { MyBid } from "@/types/auction";

export function useMyBids() {
  const [bids, setBids] = useState<MyBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiListResponse<ApiMyBid>>("/my-bids")
      .then((response) => {
        if (!cancelled) setBids(response.data.map(mapApiMyBid));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your bids from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { bids, loading, error };
}
