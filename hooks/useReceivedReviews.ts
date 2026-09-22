"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import {
  listingTitleFromReview,
  mapApiReviewToListingReview,
  type ApiReviewsResponse,
} from "@/lib/mapApiReview";
import type { MyReview } from "@/hooks/useMyReviews";

export type ReceivedReviewsResult = {
  reviews: MyReview[];
  loading: boolean;
  error: string | null;
};

/** The other side of FR-F-021's dashboard: reviews other people left on this seller's/dealer's own listings. */
export function useReceivedReviews(): ReceivedReviewsResult {
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiReviewsResponse>("/received-reviews")
      .then((response) => {
        if (cancelled) return;
        setReviews(
          response.data.map((review) => ({
            ...mapApiReviewToListingReview(review),
            listingTitle: listingTitleFromReview(review),
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your reviews from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { reviews, loading, error };
}
