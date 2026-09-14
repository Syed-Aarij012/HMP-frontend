import type { ListingReview } from "@/data/listingReviews";

export type ApiReview = {
  id: number;
  listing_id?: number | null;
  rating: number;
  comment: string | null;
  verified_purchase: boolean;
  reviewer_name?: string;
  listing?: {
    id: string;
    vehicle?: { make?: string; model?: string; derivative?: string } | null;
  };
  created_at: string;
};

export type ApiReviewsResponse = {
  data: ApiReview[];
};

// The real Review model has no category taxonomy (mileage/performance/safety/looks/
// comfort) the way the template's mock reviews do — every real review is left uncategorized
// so it still shows under the "All" tab, just not under any specific one.
export function mapApiReviewToListingReview(review: ApiReview): ListingReview {
  return {
    id: review.id,
    author: review.reviewer_name ?? "Verified buyer",
    avatar: "/assets/images/blog/avt1.webp",
    date: new Date(review.created_at).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    rating: review.rating,
    text: review.comment ?? "",
    categories: [],
  };
}

export function listingTitleFromReview(review: ApiReview): string | null {
  const vehicle = review.listing?.vehicle;
  if (!vehicle) return null;
  return [vehicle.make, vehicle.derivative ?? vehicle.model].filter(Boolean).join(" ") || null;
}
