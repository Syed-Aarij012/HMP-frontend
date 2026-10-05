"use client";

import { useCallback, useEffect, useState } from "react";
import { useResumableUpload } from "@/hooks/useResumableUpload";
import { apiFetch, describeApiError } from "@/lib/api-client";
import type { VehicleExtrasApi } from "@/lib/vehicleExtras";

export type EditableVehicle = {
  id: string;
  current_vrm: string | null;
  make: string | null;
  model: string | null;
  derivative: string | null;
  body_type: string | null;
  fuel_type: string | null;
  transmission: string | null;
  colour: string | null;
  doors: number | null;
  seats: number | null;
  year: number | null;
  current_mileage: number | null;
  v5c_status: string | null;
  vat_status: string | null;
  provenance_status: string;
} & VehicleExtrasApi;

export type EditableListing = {
  id: string;
  status: string;
  price: string | number;
  price_type: string;
  description: string | null;
  postcode: string | null;
};

export type EditableMedia = {
  id: number;
  type: string;
  url: string;
  duration_seconds: number | null;
  qa_status: "pending" | "passed" | "failed";
  qa_message: string | null;
};

export type EditPayload = {
  listing: EditableListing;
  vehicle: EditableVehicle;
  vehicle_locked_reason: string | null;
  media: EditableMedia[];
};

/**
 * Everything the seller's "edit all details" page does for one listing: load it, save the
 * vehicle's details and the listing's own fields (only what changed), and add or remove
 * photos and video. Media goes through the resumable chunked-upload sessions (FR-A-010) — PHP
 * rejects any single uploaded file over upload_max_filesize (2 MB by default).
 */
export function useEditListing(listingId: string) {
  const { upload, clearSession } = useResumableUpload();
  const [data, setData] = useState<EditPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaStatus, setMediaStatus] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await apiFetch<{ data: EditPayload }>(`/listings/${listingId}/edit`);
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(describeApiError(err, "Could not load this listing for editing."));
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  /**
   * Vehicle fields first, then the listing's. Returns an error message, or null when saved.
   * A vehicle change can fail on its own (locked, validation) without the listing part
   * having been touched, so the two are reported separately.
   */
  const save = useCallback(
    async (vehicleChanges: Record<string, unknown>, listingChanges: Record<string, unknown>): Promise<string | null> => {
      if (!data) return "Nothing loaded to save.";

      if (Object.keys(vehicleChanges).length > 0) {
        try {
          await apiFetch(`/vehicles/${data.vehicle.id}`, { method: "PATCH", body: vehicleChanges });
        } catch (err) {
          return describeApiError(err, "Could not save the vehicle details.");
        }
      }

      if (Object.keys(listingChanges).length > 0) {
        try {
          await apiFetch(`/listings/${listingId}`, { method: "PATCH", body: listingChanges });
        } catch (err) {
          const prefix = Object.keys(vehicleChanges).length > 0 ? "The vehicle details were saved, but the listing couldn't be: " : "";
          return prefix + describeApiError(err, "Could not save the listing.");
        }
      }

      await load();
      return null;
    },
    [data, listingId, load],
  );

  const removeMedia = useCallback(
    async (mediaId: number) => {
      if (!data) return;
      setMediaError(null);
      try {
        await apiFetch(`/vehicles/${data.vehicle.id}/photos/${mediaId}`, { method: "DELETE" });
        await load();
      } catch (err) {
        setMediaError(describeApiError(err, "Could not remove that file."));
      }
    },
    [data, load],
  );

  const addPhotos = useCallback(
    async (files: File[]) => {
      if (!data) return;
      setMediaError(null);
      try {
        for (let i = 0; i < files.length; i++) {
          setMediaStatus(`Uploading photo ${i + 1} of ${files.length}...`);
          const sessionId = await upload(files[i]);
          if (!sessionId) throw new Error(`${files[i].name} could not be uploaded. Please try again.`);
          await apiFetch(`/vehicles/${data.vehicle.id}/photos/from-upload`, { method: "POST", body: { upload_session_id: sessionId } });
          clearSession(files[i]);
        }
      } catch (err) {
        setMediaError(describeApiError(err, err instanceof Error ? err.message : "A photo could not be uploaded."));
      } finally {
        setMediaStatus(null);
        await load();
      }
    },
    [data, upload, clearSession, load],
  );

  const addVideo = useCallback(
    async (file: File, durationSeconds: number) => {
      if (!data) return;
      setMediaError(null);
      try {
        setMediaStatus("Uploading video (large files can take a few minutes)...");
        const sessionId = await upload(file);
        if (!sessionId) throw new Error("The video could not be uploaded. Please try again.");
        await apiFetch(`/vehicles/${data.vehicle.id}/videos/from-upload`, {
          method: "POST",
          body: { upload_session_id: sessionId, duration_seconds: durationSeconds },
        });
        clearSession(file);
      } catch (err) {
        setMediaError(describeApiError(err, err instanceof Error ? err.message : "The video could not be uploaded."));
      } finally {
        setMediaStatus(null);
        await load();
      }
    },
    [data, upload, clearSession, load],
  );

  return { data, loading, error, save, removeMedia, addPhotos, addVideo, mediaStatus, mediaError };
}
