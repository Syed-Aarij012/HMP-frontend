"use client";

import { useCallback, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiTradeFixedPriceListing, type ApiTradeFixedPriceListing } from "@/lib/mapApiTradeFixedPrice";
import type { TradeFixedPriceListing } from "@/types/tradeFixedPrice";

export type CreateTradeFixedPriceListingInput = {
  make: string;
  model: string;
  derivative?: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  colour?: string;
  year: number;
  mileage: number;
  askingPrice: number;
  photoFiles?: File[];
  video?: { file: File; durationSeconds: number } | null;
  spinFrames?: File[];
};

type ApiVehicle = { data: { id: string } };

/**
 * FR-A-030 (M): the self-service side of listing a vehicle on the Fixed-Price Trade ("Buy
 * Now") channel — same vehicle self-declaration as Consign Vehicle, but claims the
 * fixed_price channel instead of auction_lot. TradeFixedPriceService::create() requires a
 * published condition report, so a freshly self-declared vehicle (no inspector-issued
 * report) won't be purchasable until one exists — same gate the auction channel has.
 */
export function useCreateTradeFixedPriceListing() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (input: CreateTradeFixedPriceListingInput): Promise<TradeFixedPriceListing> => {
    setError(null);
    setSubmitting(true);

    try {
      const vehicleResponse = await apiFetch<ApiVehicle>("/vehicles", {
        method: "POST",
        body: {
          make: input.make,
          model: input.model,
          derivative: input.derivative || undefined,
          body_type: input.bodyType,
          fuel_type: input.fuelType,
          transmission: input.transmission,
          colour: input.colour || undefined,
          year: input.year,
          current_mileage: input.mileage,
        },
      });

      for (const file of input.photoFiles ?? []) {
        const formData = new FormData();
        formData.append("photo", file);
        await apiFetch(`/vehicles/${vehicleResponse.data.id}/photos`, { method: "POST", body: formData });
      }

      if (input.video) {
        const formData = new FormData();
        formData.append("video", input.video.file);
        formData.append("duration_seconds", String(input.video.durationSeconds));
        await apiFetch(`/vehicles/${vehicleResponse.data.id}/videos`, { method: "POST", body: formData });
      }

      if (input.spinFrames?.length) {
        const formData = new FormData();
        input.spinFrames.forEach((frame) => formData.append("frames[]", frame));
        await apiFetch(`/vehicles/${vehicleResponse.data.id}/spin-sets`, { method: "POST", body: formData });
      }

      const listingResponse = await apiFetch<{ data: ApiTradeFixedPriceListing }>("/trade/fixed-price-listings", {
        method: "POST",
        body: {
          vehicle_master_record_id: vehicleResponse.data.id,
          asking_price: input.askingPrice,
        },
      });

      return mapApiTradeFixedPriceListing(listingResponse.data);
    } catch (err) {
      setError(describeApiError(err, "Could not create this fixed-price listing right now."));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { create, submitting, error };
}
