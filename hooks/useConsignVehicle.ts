"use client";

import { useCallback, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import type { ApiAuctionLot } from "@/lib/mapApiAuction";
import { mapApiLot } from "@/lib/mapApiAuction";

export type ConsignVehicleInput = {
  saleId: number;
  make: string;
  model: string;
  derivative?: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  colour?: string;
  doors?: number;
  seats?: number;
  year: number;
  mileage: number;
  photoFiles?: File[];
  video?: { file: File; durationSeconds: number } | null;
  spinFrames?: File[];
};

type ApiVehicle = { data: { id: string } };

/**
 * FR-D-001/002 consignment intake, self-service side: the trade buyer describes their own
 * vehicle (same StoreVehicleRequest flow as "Add listing") and it's immediately consigned
 * into the chosen sale, entering the Cataloged state.
 */
export function useConsignVehicle() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);

  const consign = useCallback(async (input: ConsignVehicleInput) => {
    setError(null);
    setSubmitting(true);
    setStage("Creating vehicle...");

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
          doors: input.doors,
          seats: input.seats,
          year: input.year,
          current_mileage: input.mileage,
        },
      });

      // FR-A-010: same self-service media path as Add Listing — a trade buyer's own
      // vehicle has no inspector-captured photos, so this is the only source of imagery a
      // consigned lot will ever have until/unless it's later inspected.
      let photoIndex = 0;
      for (const file of input.photoFiles ?? []) {
        photoIndex += 1;
        setStage(`Uploading photo ${photoIndex} of ${input.photoFiles?.length}...`);
        const formData = new FormData();
        formData.append("photo", file);
        await apiFetch(`/vehicles/${vehicleResponse.data.id}/photos`, {
          method: "POST",
          body: formData,
        });
      }

      if (input.video) {
        setStage("Uploading video (large files can take several minutes)...");
        const formData = new FormData();
        formData.append("video", input.video.file);
        formData.append("duration_seconds", String(input.video.durationSeconds));
        await apiFetch(`/vehicles/${vehicleResponse.data.id}/videos`, {
          method: "POST",
          body: formData,
        });
      }

      if (input.spinFrames?.length) {
        setStage(`Uploading ${input.spinFrames.length} spin frames...`);
        const formData = new FormData();
        input.spinFrames.forEach((frame) => formData.append("frames[]", frame));
        await apiFetch(`/vehicles/${vehicleResponse.data.id}/spin-sets`, {
          method: "POST",
          body: formData,
        });
      }

      setStage("Adding to sale...");
      const lotResponse = await apiFetch<{ data: ApiAuctionLot }>("/auction/lots", {
        method: "POST",
        body: {
          sale_id: input.saleId,
          vehicle_master_record_id: vehicleResponse.data.id,
        },
      });

      return mapApiLot(lotResponse.data);
    } catch (err) {
      const message = describeApiError(err, "Could not consign this vehicle right now.");
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
      setStage(null);
    }
  }, []);

  return { consign, submitting, error, stage };
}
