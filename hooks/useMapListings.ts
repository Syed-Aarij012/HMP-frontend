"use client";

import { useMemo } from "react";
import { useHomepageListings, type HomepageListingsResult } from "@/hooks/useHomepageListings";
import { hashListingId } from "@/lib/mapApiListing";
import type { MapCar } from "@/lib/listingMapUtils";

export type MapListingsResult = Omit<HomepageListingsResult, "cars"> & {
  cars: MapCar[];
};

// The backend has no location data for a listing at all — no dealer/vehicle lat-lng
// column exists (see lib/mapApiDealer.ts, which only has a free-text postcode/city).
// The map UI, however, was built around mock pins scattered a short drive apart in one
// city, so a single plausible UK point stands in for "where this listing roughly is".
// Central England (near Birmingham) is used as that point since it isn't any specific
// real dealer's address.
const SYNTHETIC_MAP_CENTER: [number, number] = [52.4862, -1.8904];

// Same order of magnitude as the mock data/listingMapLocations.ts spread around its own
// center (~±0.003 lat, ~±0.014 lng) — keeps pins clustered plausibly close together
// rather than scattered across the whole country.
const LAT_SPREAD = 0.03;
const LNG_SPREAD = 0.14;

/**
 * Deterministically derives a fake-but-stable lat/lng for a listing from its real backend
 * id, so a given listing always renders at the same map pin across reloads/sessions even
 * though nothing about its real-world location is known. This is a documented rendering
 * stand-in only, not a real address for any of these vehicles.
 */
function deriveSyntheticMapPosition(publicId: string): [number, number] {
  const latHash = hashListingId(`lat:${publicId}`);
  const lngHash = hashListingId(`lng:${publicId}`);
  const latOffset = ((latHash % 2000) / 1000 - 1) * LAT_SPREAD;
  const lngOffset = ((lngHash % 2000) / 1000 - 1) * LNG_SPREAD;
  return [
    SYNTHETIC_MAP_CENTER[0] + latOffset,
    SYNTHETIC_MAP_CENTER[1] + lngOffset,
  ];
}

/**
 * Same live listings as useHomepageListings, extended with a synthetic mapPosition so the
 * existing map browse pages (listing-grid-map, listing-list-map) — built for mock cars that
 * already carried a mapPosition — keep working unchanged against real API data.
 */
export function useMapListings(perPage = 60): MapListingsResult {
  const { cars, ...rest } = useHomepageListings(perPage);

  const mapCars = useMemo<MapCar[]>(
    () =>
      cars.map((car) => ({
        ...car,
        mapPosition: deriveSyntheticMapPosition(car.publicId ?? String(car.id)),
      })),
    [cars],
  );

  return { cars: mapCars, ...rest };
}
