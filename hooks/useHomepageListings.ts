"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import {
  mapApiListingToCar,
  type ApiFacetBucket,
  type ApiListingsResponse,
} from "@/lib/mapApiListing";
import type { Car } from "@/types/cars";

type FacetCounts = Record<string, number>;

// "All" comes first and is the default: real listings are tagged "New car" only under a
// near-zero mileage, so splitting the live listings into New/Used tabs and defaulting to
// whichever has cars hid every other car behind a tab nobody had clicked.
export const HOME_LISTING_TABS = ["All", "New car", "Used car"] as const;
export type HomeListingTab = (typeof HOME_LISTING_TABS)[number];

export function carsForTab(cars: Car[], tab: HomeListingTab): Car[] {
  return tab === "All" ? cars : cars.filter((car) => car.listingType?.includes(tab));
}

export type HomepageListingsResult = {
  cars: Car[];
  makeCounts: FacetCounts;
  bodyTypeCounts: FacetCounts;
  // Real vehicle model names (e.g. "Focus", "Civic") straight from the facet — unlike
  // makeCounts/bodyTypeCounts above, keys are NOT lowercased: the model filter matches
  // car.filterModel (= vehicle.model) with an exact, case-sensitive compare, so this has to
  // carry the original casing through to stay matchable.
  modelOptions: ApiFacetBucket[];
  loading: boolean;
  error: string | null;
};

function toCounts(entries?: { value: string; count: number }[]): FacetCounts {
  const counts: FacetCounts = {};
  for (const entry of entries ?? []) {
    counts[entry.value.toLowerCase()] = entry.count;
  }
  return counts;
}

/**
 * The public, anonymous-browsing GET /listings endpoint (FR-C §2.2 P1) — same one the
 * dedicated listing pages use. The homepage just takes a page of it plus its facet counts,
 * rather than the hand-authored mock arrays in data/cars.ts.
 */
export function useHomepageListings(perPage = 12): HomepageListingsResult {
  const [cars, setCars] = useState<Car[]>([]);
  const [makeCounts, setMakeCounts] = useState<FacetCounts>({});
  const [bodyTypeCounts, setBodyTypeCounts] = useState<FacetCounts>({});
  const [modelOptions, setModelOptions] = useState<ApiFacetBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiListingsResponse>(`/listings?per_page=${perPage}`, { auth: false })
      .then((response) => {
        if (cancelled) return;
        setCars(response.data.map(mapApiListingToCar));
        setMakeCounts(toCounts(response.facets?.make));
        setBodyTypeCounts(toCounts(response.facets?.body_type));
        setModelOptions(response.facets?.model ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load live listings from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [perPage]);

  return { cars, makeCounts, bodyTypeCounts, modelOptions, loading, error };
}
