"use client";

import { useCallback, useRef, useState } from "react";
import { ApiError, apiFetch, describeApiError } from "@/lib/api-client";
import { useResumableUpload } from "@/hooks/useResumableUpload";
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
  // FR-F-011 / FR-E-032: required before the lot can be published.
  v5cStatus: string;
  vatStatus: string;
  // Required under the margin scheme (the dealer's acquisition cost).
  acquisitionCost?: number;
  photoFiles?: File[];
  video?: { file: File; durationSeconds: number } | null;
  spinFrames?: File[];
};

type ApiVehicle = { data: { id: string } };

// Where a failed attempt got to, so retrying the same submission carries on instead of
// creating a second vehicle (and re-uploading photos that already landed).
type Progress = { key: string; vehicleId: string; photosDone: number; videoDone: boolean; spinDone: boolean };

// Identifies "the same submission": the vehicle's identity plus the exact files chosen.
function submissionKey(input: ConsignVehicleInput): string {
  const files = (list: File[] = []) => list.map((f) => `${f.name}:${f.size}:${f.lastModified}`).join(",");
  return JSON.stringify([
    input.saleId, input.make, input.model, input.derivative, input.year, input.mileage,
    files(input.photoFiles), input.video ? files([input.video.file]) : "", files(input.spinFrames),
  ]);
}

/**
 * FR-D-001/002 consignment intake, self-service side: the trade buyer describes their own
 * vehicle (same StoreVehicleRequest flow as "Add listing") and it's immediately consigned
 * into the chosen sale, entering the Cataloged state.
 *
 * Photos and video go through the resumable chunked-upload sessions (FR-A-010), not a single
 * multipart request: PHP rejects any one uploaded file over upload_max_filesize (2 MB by
 * default) before Laravel runs, which a phone photo or any video exceeds. Each failure names
 * the step it happened at.
 */
export function useConsignVehicle() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const { upload, clearSession } = useResumableUpload();
  const progressRef = useRef<Progress | null>(null);

  const consign = useCallback(async (input: ConsignVehicleInput) => {
    setError(null);
    setSubmitting(true);

    // Runs one step; on failure rethrows with the step named, so the message says what to retry.
    const step = async <T,>(label: string, run: () => Promise<T>): Promise<T> => {
      try {
        return await run();
      } catch (err) {
        throw new ApiError(`${label}: ${describeApiError(err, "something went wrong.")}`, err instanceof ApiError ? err.status : 0, err instanceof ApiError ? err.body : null);
      }
    };

    // Chunk-uploads a file and returns its session id, or fails with a message.
    const uploadFile = async (file: File): Promise<string> => {
      const sessionId = await upload(file);
      if (!sessionId) throw new ApiError("the upload was interrupted. Please try again.", 0, null);
      return sessionId;
    };

    try {
      const key = submissionKey(input);
      let progress = progressRef.current?.key === key ? progressRef.current : null;

      if (!progress) {
        setStage("Creating vehicle...");
        const vehicleResponse = await step("Could not save the vehicle details", () =>
          apiFetch<ApiVehicle>("/vehicles", {
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
              v5c_status: input.v5cStatus,
              vat_status: input.vatStatus,
            },
          }),
        );
        progress = { key, vehicleId: vehicleResponse.data.id, photosDone: 0, videoDone: false, spinDone: false };
        progressRef.current = progress;
      }

      const vehicleId = progress.vehicleId;

      // FR-A-010: same self-service media path as Add Listing — a trade buyer's own
      // vehicle has no inspector-captured photos, so this is the only source of imagery a
      // consigned lot will ever have until/unless it's later inspected.
      const photos = input.photoFiles ?? [];
      for (let i = progress.photosDone; i < photos.length; i++) {
        setStage(`Uploading photo ${i + 1} of ${photos.length}...`);
        await step(`Photo ${i + 1} (${photos[i].name}) could not be uploaded`, async () => {
          const uploadSessionId = await uploadFile(photos[i]);
          await apiFetch(`/vehicles/${vehicleId}/photos/from-upload`, { method: "POST", body: { upload_session_id: uploadSessionId } });
          clearSession(photos[i]);
        });
        progress.photosDone = i + 1;
      }

      if (input.video && !progress.videoDone) {
        const video = input.video;
        setStage("Uploading video (large files can take several minutes)...");
        await step("The video could not be uploaded", async () => {
          const uploadSessionId = await uploadFile(video.file);
          await apiFetch(`/vehicles/${vehicleId}/videos/from-upload`, {
            method: "POST",
            body: { upload_session_id: uploadSessionId, duration_seconds: video.durationSeconds },
          });
          clearSession(video.file);
        });
        progress.videoDone = true;
      }

      if (input.spinFrames?.length && !progress.spinDone) {
        setStage(`Uploading ${input.spinFrames.length} spin frames...`);
        await step("The 360 spin frames could not be uploaded", async () => {
          const formData = new FormData();
          input.spinFrames?.forEach((frame) => formData.append("frames[]", frame));
          await apiFetch(`/vehicles/${vehicleId}/spin-sets`, { method: "POST", body: formData });
        });
        progress.spinDone = true;
      }

      setStage("Adding to sale...");
      const lotResponse = await step("The vehicle was saved but could not be added to the sale", () =>
        apiFetch<{ data: ApiAuctionLot }>("/auction/lots", {
          method: "POST",
          body: {
            sale_id: input.saleId,
            vehicle_master_record_id: vehicleId,
            dealer_acquisition_cost: input.vatStatus === "margin_scheme" ? input.acquisitionCost : undefined,
          },
        }),
      );

      progressRef.current = null;
      return mapApiLot(lotResponse.data);
    } catch (err) {
      setError(describeApiError(err, "Could not consign this vehicle right now."));
      throw err;
    } finally {
      setSubmitting(false);
      setStage(null);
    }
  }, [upload, clearSession]);

  return { consign, submitting, error, stage };
}
