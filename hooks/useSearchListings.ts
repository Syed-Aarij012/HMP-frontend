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
  // FR-B-001: the real faceted-browse dimensions — each is sent straight through to
  // GET /listings, which already supports every one of these as a filter.
  make: string;
  model: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  colour: string;
  doors: string;
  seats: string;
  sellerType: string;
  yearMin: string;
  yearMax: string;
  mileageMin: string;
  mileageMax: string;
  priceMin: string;
  priceMax: string;
  taxBand: string;
  conditionGrade: string;
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
  make: "",
  model: "",
  bodyType: "",
  fuelType: "",
  transmission: "",
  colour: "",
  doors: "",
  seats: "",
  sellerType: "",
  yearMin: "",
  yearMax: "",
  mileageMin: "",
  mileageMax: "",
  priceMin: "",
  priceMax: "",
  taxBand: "",
  conditionGrade: "",
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
  const [nationalFallback, setNationalFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [facets, setFacets] = useState<ApiListingsResponse["facets"] | null>(null);
  const [meta, setMeta] = useState<ApiListingsResponse["meta"] | null>(null);

  const {
    query, sort, postcode, radius, monthlyMax, deposit, term, product,
    make, model, bodyType, fuelType, transmission, colour, doors, seats,
    sellerType, yearMin, yearMax, mileageMin, mileageMax, priceMin, priceMax,
    taxBand, conditionGrade,
  } = params;

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
    if (make) qs.set("make", make);
    if (model) qs.set("model", model);
    if (bodyType) qs.set("body_type", bodyType);
    if (fuelType) qs.set("fuel_type", fuelType);
    if (transmission) qs.set("transmission", transmission);
    if (colour) qs.set("colour", colour);
    if (doors) qs.set("doors", doors);
    if (seats) qs.set("seats", seats);
    if (sellerType) qs.set("seller_type", sellerType);
    if (yearMin) qs.set("year_min", yearMin);
    if (yearMax) qs.set("year_max", yearMax);
    if (mileageMin) qs.set("mileage_min", mileageMin);
    if (mileageMax) qs.set("mileage_max", mileageMax);
    if (priceMin) qs.set("price_min", priceMin);
    if (priceMax) qs.set("price_max", priceMax);
    if (taxBand) qs.set("tax_band", taxBand);
    if (conditionGrade) qs.set("condition_grade", conditionGrade);

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
        setNationalFallback(response.location?.national_fallback ?? false);
        setFacets(response.facets ?? null);
        setMeta(response.meta ?? null);
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
  }, [
    query, sort, postcode, radius, monthlyMax, deposit, term, product, perPage,
    make, model, bodyType, fuelType, transmission, colour, doors, seats,
    sellerType, yearMin, yearMax, mileageMin, mileageMax, priceMin, priceMax,
    taxBand, conditionGrade,
  ]);

  return { cars, interpretation, locationArea, nationalFallback, facets, meta, loading, error, searchError };
}
