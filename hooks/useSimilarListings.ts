"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { mapApiListingToCar, type ApiListingsResponse } from "@/lib/mapApiListing";
import type { Car } from "@/types/cars";

export type SimilarListingsResult = {
  cars: Car[];
  loading: boolean;
  error: string | null;
};

/**
 * FR-B-007: the server's similar-vehicles ranking (GET /listings/{id}/similar) — same model
 * first, then same make/body type, scored by price/year closeness. Only fetched for a real
 * listing (car.publicId set); a mock/demo car has no real record to compare against, so the
 * caller keeps showing whatever static list it already has.
 */
export function useSimilarListings(car: Car, limit = 8): SimilarListingsResult {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(Boolean(car.publicId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!car.publicId) {
      queueMicrotask(() => {
        if (!cancelled) {
          setCars([]);
          setLoading(false);
          setError(null);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });

    apiFetch<ApiListingsResponse>(`/listings/${car.publicId}/similar?limit=${limit}`, { auth: false })
      .then((response) => {
        if (cancelled) return;
        setCars(response.data.map(mapApiListingToCar));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load similar cars from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [car.publicId, limit]);

  return { cars, loading, error };
}
