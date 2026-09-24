"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { mapApiListingToCar, type ApiListingsResponse } from "@/lib/mapApiListing";
import type { Car } from "@/types/cars";

export type SearchInterpretation = NonNullable<ApiListingsResponse["search"]>;

export const LISTING_SORTS = [
  { value: "best_match", label: "Best match" },
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "mileage_asc", label: "Lowest mileage" },
  { value: "year_desc", label: "Newest year" },
  { value: "distance", label: "Nearest first (needs postcode)" },
] as const;

export type ListingSearchParams = {
  query: string;
  sort: string;
  postcode: string;
  radius: number;
  monthlyMax: string;
  deposit: string;
  term: number;
  product: "pcp" | "hp";
};

export const DEFAULT_SEARCH_PARAMS: ListingSearchParams = {
  query: "",
  sort: "best_match",
  postcode: "",
  radius: 30,
  monthlyMax: "",
  deposit: "1000",
  term: 48,
  product: "pcp",
};

/**
 * FR-B-001/003/004/006/009: server-side search against the public GET /listings — free text
 * (synonyms, typo tolerance), postcode + radius, monthly-budget, sort — with the per-result
 * distance, finance example and badges merged onto each Car as `extras`.
 */
export function useSearchListings(params: ListingSearchParams, perPage = 60) {
  const [cars, setCars] = useState<Car[]>([]);
  const [interpretation, setInterpretation] = useState<SearchInterpretation | null>(null);
  const [locationArea, setLocationArea] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { query, sort, postcode, radius, monthlyMax, deposit, term, product } = params;

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    const qs = new URLSearchParams({ per_page: String(perPage), sort, badges: "1" });
    if (query.trim()) qs.set("q", query.trim());
    if (postcode.trim()) {
      qs.set("postcode", postcode.trim());
      qs.set("radius", String(radius));
    }
    if (monthlyMax.trim()) {
      qs.set("monthly_max", monthlyMax.trim());
      qs.set("deposit", deposit || "0");
      qs.set("term", String(term));
      qs.set("product", product);
    }

    apiFetch<ApiListingsResponse>(`/listings?${qs.toString()}`, { auth: false })
      .then((response) => {
        if (cancelled) return;

        const mapped = response.data.map((apiListing) => {
          const car = mapApiListingToCar(apiListing);
          const location = response.location?.results?.[apiListing.id];
          const finance = response.finance?.[apiListing.id];
          const badge = response.badges?.[apiListing.id];

          car.extras = {
            distanceMiles: location?.distance_miles ?? null,
            driveTimeBand: location?.drive_time_band ?? null,
            deliveryEligible: location?.delivery_eligible ?? false,
            monthlyPayment: finance ? Number(finance.monthly_payment) : null,
            apr: finance ? Number(finance.apr) : null,
            representativeExample: finance?.representative_example ?? null,
            priceDropAmount: badge?.price_drop ? Number(badge.price_drop.amount) : null,
            marketLabel: badge?.market_context?.label ?? null,
          };
          return car;
        });

        setCars(mapped);
        setInterpretation(response.search ?? null);
        setLocationArea(response.location?.area ?? null);
        setSearchError(null);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        // A 422 here is a user-fixable search problem (unknown postcode, no finance rates) —
        // show it inline and keep the previous results rather than blanking the page.
        if (err instanceof ApiError && err.status === 422) {
          const body = err.body as { message?: string } | null;
          setSearchError(body?.message ?? "That search could not be run.");
        } else {
          setError("Could not load live listings from the server.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, sort, postcode, radius, monthlyMax, deposit, term, product, perPage]);

  return { cars, interpretation, locationArea, loading, error, searchError };
}
