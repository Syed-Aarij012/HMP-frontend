"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import {
  mapApiReviewToListingReview,
  type ApiReview,
  type ApiReviewsResponse,
} from "@/lib/mapApiReview";
import type { ListingReview } from "@/data/listingReviews";

export type ListingReviewsResult = {
  reviews: ListingReview[];
  averageRating: number | null;
  loading: boolean;
  error: string | null;
  submitReview: (rating: number, comment: string) => Promise<void>;
};

/**
 * FR-F-021: a specific listing's own reviews — public, no auth required, same visibility
 * as the listing itself. `publicId` is the listing's real ULID (Car.publicId); pass
 * undefined for a mock listing, which has no real reviews to fetch.
 */
export function useListingReviews(publicId: string | undefined): ListingReviewsResult {
  const [reviews, setReviews] = useState<ListingReview[]>([]);
  const [loading, setLoading] = useState(Boolean(publicId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!publicId) {
      queueMicrotask(() => {
        if (!cancelled) {
          setReviews([]);
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    apiFetch<ApiReviewsResponse>(`/listings/${publicId}/reviews`, { auth: false })
      .then((response) => {
        if (!cancelled) setReviews(response.data.map(mapApiReviewToListingReview));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load reviews from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [publicId]);

  const averageRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : null;

  const submitReview = useCallback(
    async (rating: number, comment: string) => {
      if (!publicId) return;

      const response = await apiFetch<{ data: ApiReview }>(`/listings/${publicId}/reviews`, {
        method: "POST",
        body: { rating, comment: comment || undefined },
      });

      setReviews((current) => [mapApiReviewToListingReview(response.data), ...current]);
    },
    [publicId]
  );

  return { reviews, averageRating, loading, error, submitReview };
}
