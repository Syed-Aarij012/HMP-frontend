"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { mapApiExposure } from "@/lib/mapApiAuction";
import type { AuctionExposure } from "@/types/auction";

/** FR-D-023: a trade buyer's own committed-exposure/headroom picture. */
export function useExposure() {
  const [exposure, setExposure] = useState<AuctionExposure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<{ committed_exposure: string; available_headroom: string }>("/my-exposure")
      .then((response) => {
        if (!cancelled) setExposure(mapApiExposure(response));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your exposure from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { exposure, loading, error };
}
