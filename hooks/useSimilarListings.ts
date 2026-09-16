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
 * Other live listings sharing this car's make, excluding itself — the closest honest
 * "similar cars" signal the backend's real filters support (body_type would need the raw
 * enum token, not the display label Car.filterBodyType carries, to filter server-side).
 * Only fetched for a real listing (car.publicId set); a mock/demo car has no real make to
 * filter by, so the caller keeps showing whatever static list it already has.
 */
export function useSimilarListings(car: Car, limit = 8): SimilarListingsResult {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(Boolean(car.publicId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!car.publicId || !car.filterMake) {
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

    const params = new URLSearchParams({
      make: car.filterMake,
      per_page: String(limit + 1),
    });

    apiFetch<ApiListingsResponse>(`/listings?${params.toString()}`, { auth: false })
      .then((response) => {
        if (cancelled) return;
        setCars(
          response.data
            .filter((listing) => listing.id !== car.publicId)
            .slice(0, limit)
            .map(mapApiListingToCar)
        );
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
  }, [car.publicId, car.filterMake, limit]);

  return { cars, loading, error };
}
