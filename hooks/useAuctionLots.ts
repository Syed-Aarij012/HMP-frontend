"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiLot, type ApiAuctionFacets, type ApiAuctionLot, type ApiListResponse } from "@/lib/mapApiAuction";
import type { AuctionLot } from "@/types/auction";

export type AuctionLotFilters = {
  make: string;
  model: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  colour: string;
  doors: string;
  seats: string;
  conditionGrade: string;
  yearMin: string;
  yearMax: string;
  mileageMin: string;
  mileageMax: string;
  taxBand: string;
  saleId: string;
};

export const DEFAULT_AUCTION_LOT_FILTERS: AuctionLotFilters = {
  make: "",
  model: "",
  bodyType: "",
  fuelType: "",
  transmission: "",
  colour: "",
  doors: "",
  seats: "",
  conditionGrade: "",
  yearMin: "",
  yearMax: "",
  mileageMin: "",
  mileageMax: "",
  taxBand: "",
  saleId: "",
};

/**
 * FR-B-001: the trade-only auction catalog. §2.3 restricts this to trade buyers/dealers —
 * a private buyer's token gets a 403 here, surfaced as `error` rather than an empty list.
 * Also returns the live `facets` GET /auction/lots computes against the currently-applied
 * filter, so a catalog filter UI has real options/counts to build from.
 */
export function useAuctionLots(statusFilter: string | undefined, filters: AuctionLotFilters = DEFAULT_AUCTION_LOT_FILTERS) {
  const [lots, setLots] = useState<AuctionLot[]>([]);
  const [facets, setFacets] = useState<ApiAuctionFacets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    make, model, bodyType, fuelType, transmission, colour, doors, seats,
    conditionGrade, yearMin, yearMax, mileageMin, mileageMax, taxBand, saleId,
  } = filters;

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    const qs = new URLSearchParams();
    if (statusFilter) qs.set("status", statusFilter);
    if (make) qs.set("make", make);
    if (model) qs.set("model", model);
    if (bodyType) qs.set("body_type", bodyType);
    if (fuelType) qs.set("fuel_type", fuelType);
    if (transmission) qs.set("transmission", transmission);
    if (colour) qs.set("colour", colour);
    if (doors) qs.set("doors", doors);
    if (seats) qs.set("seats", seats);
    if (conditionGrade) qs.set("condition_grade", conditionGrade);
    if (yearMin) qs.set("year_min", yearMin);
    if (yearMax) qs.set("year_max", yearMax);
    if (mileageMin) qs.set("mileage_min", mileageMin);
    if (mileageMax) qs.set("mileage_max", mileageMax);
    if (taxBand) qs.set("tax_band", taxBand);
    if (saleId) qs.set("sale_id", saleId);
    const query = qs.toString() ? `?${qs.toString()}` : "";

    apiFetch<ApiListResponse<ApiAuctionLot>>(`/auction/lots${query}`)
      .then((response) => {
        if (!cancelled) {
          setLots(response.data.map(mapApiLot));
          setFacets(response.facets ?? null);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the auction catalog from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [statusFilter, make, model, bodyType, fuelType, transmission, colour, doors, seats, conditionGrade, yearMin, yearMax, mileageMin, mileageMax, taxBand, saleId]);

  /**
   * FR-D-003: Cataloged → Published, for run-list staff (the backend refuses anyone else, and
   * any lot still missing VAT/V5C/condition-report details). Returns the server's reason on
   * failure; on success the row's status updates in place.
   */
  const publish = useCallback(async (lotId: string): Promise<string | null> => {
    try {
      const response = await apiFetch<{ data: ApiAuctionLot }>(`/auction/lots/${lotId}/publish`, { method: "POST" });
      const updated = mapApiLot(response.data);
      setLots((current) =>
        current.map((lot) => (lot.id === lotId ? { ...lot, status: updated.status, publishBlockers: null } : lot)),
      );
      return null;
    } catch (err) {
      return describeApiError(err, "Could not publish this lot.");
    }
  }, []);

  return { lots, facets, loading, error, publish };
}
