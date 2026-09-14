"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import {
  listingTitleFromReview,
  mapApiReviewToListingReview,
  type ApiReviewsResponse,
} from "@/lib/mapApiReview";
import type { ListingReview } from "@/data/listingReviews";

export type MyReview = ListingReview & { listingTitle: string | null };

export type MyReviewsResult = {
  reviews: MyReview[];
  loading: boolean;
  error: string | null;
};

/** FR-F-021: every review the signed-in user has left, across every listing. */
export function useMyReviews(): MyReviewsResult {
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiReviewsResponse>("/my-reviews")
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
