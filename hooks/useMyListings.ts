"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { hashListingId } from "@/lib/mapApiListing";
import type { DashboardCar, DashboardListingStatus } from "@/types/cars";

type ApiListing = {
  id: string;
  status: string;
  price: string | number;
  price_type?: string;
  published_at: string | null;
  review_note?: string | null;
  vehicle: {
    id?: string;
    make?: string;
    model?: string;
    derivative?: string;
    year?: number;
    fuel_type?: string;
    transmission?: string;
    photos?: { url: string; type: string; sequence: number }[];
  } | null;
};

type ApiListingsResponse = {
  data: ApiListing[];
};

/**
 * The dashboard badge for a listing's lifecycle status (ListingLifecycleService::TRANSITIONS).
 * Only `pending_checks` is genuinely "pending" — a draft that was never published, an offer
 * being negotiated, a withdrawn or expired listing each get their own label.
 */
export function mapStatus(status: string): DashboardListingStatus {
  switch (status) {
    case "live":
      return "approved";
    case "pending_checks":
      return "pending";
    case "draft":
    case "under_offer":
    case "reserved":
    case "withdrawn":
    case "expired":
    case "sold":
      return status;
    default:
      return "pending";
  }
}

function mapListing(listing: ApiListing): DashboardCar {
  const vehicle = listing.vehicle;
  const title = vehicle
    ? [vehicle.make, vehicle.model, vehicle.derivative].filter(Boolean).join(" ")
    : "Untitled listing";
  const firstPhoto = (vehicle?.photos ?? [])
    .filter((photo) => photo.type !== "video")
    .sort((a, b) => a.sequence - b.sequence)[0]?.url;
  const image = firstPhoto ?? "/assets/images/car-list/car1.webp";

  return {
    // Real listing ids are ULID strings (e.g. "01m22w7b..."), not numbers — Number(id)
    // returns NaN for every one of them, which previously collapsed every row to id: 0
    // and made DashboardListingsTable's per-row edit/delete match every listing at once.
    id: hashListingId(listing.id),
    // The numeric id above is only a stable row key — a detail URL built from it (the
    // getCarHref fallback) resolves against the template's mock cars and 404s for a real
    // listing, whose route param is the ULID.
    href: `/listing-detail-v1/${listing.id}`,
    image,
    publicId: listing.id,
    title: title || "Untitled listing",
    price: Number(listing.price) || 0,
    mileage: 0,
    transmission: vehicle?.transmission ?? "-",
    fuel: vehicle?.fuel_type ?? "-",
    tag: vehicle?.year ? String(vehicle.year) : "-",
    photoCount: 0,
    dashboardImage: image,
    dashboardStatus: mapStatus(listing.status),
    rawStatus: listing.status,
    priceType: listing.price_type,
    vehiclePublicId: vehicle?.id,
    postingDate: listing.published_at ?? new Date().toISOString(),
    publishedAt: listing.published_at,
    reviewNote: listing.review_note ?? null,
  };
}

export function useMyListings() {
  const [listings, setListings] = useState<DashboardCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiListingsResponse>("/my-listings")
      .then((response) => {
        if (!cancelled) setListings(response.data.map(mapListing));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your listings from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { listings, loading, error };
}
