"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { hashListingId } from "@/lib/mapApiListing";
import type { DashboardCar, DashboardListingStatus } from "@/types/cars";

type ApiListing = {
  id: string;
  status: string;
  price: string | number;
  published_at: string | null;
  vehicle: {
    make?: string;
    model?: string;
    derivative?: string;
    year?: number;
    fuel_type?: string;
    transmission?: string;
  } | null;
};

type ApiListingsResponse = {
  data: ApiListing[];
};

function mapStatus(status: string): DashboardListingStatus {
  if (status === "sold") return "sold";
  if (status === "live") return "approved";
  return "pending";
}

function mapListing(listing: ApiListing): DashboardCar {
  const vehicle = listing.vehicle;
  const title = vehicle
    ? [vehicle.make, vehicle.model, vehicle.derivative].filter(Boolean).join(" ")
    : "Untitled listing";

  return {
    // Real listing ids are ULID strings (e.g. "01m22w7b..."), not numbers — Number(id)
    // returns NaN for every one of them, which previously collapsed every row to id: 0
    // and made DashboardListingsTable's per-row edit/delete match every listing at once.
    id: hashListingId(listing.id),
    image: "/assets/images/dashboard/avt-profile.jpg",
    title: title || "Untitled listing",
    price: Number(listing.price) || 0,
    mileage: 0,
    transmission: vehicle?.transmission ?? "-",
    fuel: vehicle?.fuel_type ?? "-",
    tag: vehicle?.year ? String(vehicle.year) : "-",
    photoCount: 0,
    dashboardImage: "/assets/images/dashboard/avt-profile.jpg",
    dashboardStatus: mapStatus(listing.status),
    postingDate: listing.published_at ?? new Date().toISOString(),
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
