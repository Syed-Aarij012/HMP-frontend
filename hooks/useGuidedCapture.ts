"use client";

import { useCallback } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useResumableUpload } from "@/hooks/useResumableUpload";

export type ShotUploadResult = {
  status: "passed" | "failed";
  message: string;
  photoId: number | null;
};

/**
 * FR-A-014: uploads one guided-capture shot and returns the real, synchronous QA verdict for
 * it. Goes through the same resumable chunked-upload session as Add Listing (FR-A-010) —
 * guided capture is explicitly a mobile, in-the-field flow, exactly where a dropped
 * connection is most likely.
 */
export function useGuidedCapture(vehiclePublicId: string) {
  const { upload: uploadResumable, uploading, clearSession } = useResumableUpload();

  const uploadShot = useCallback(
    async (file: File): Promise<ShotUploadResult> => {
      try {
        const uploadSessionId = await uploadResumable(file);
        if (!uploadSessionId) {
          return { status: "failed", message: "Could not upload this photo — check your connection and try again.", photoId: null };
        }

        const response = await apiFetch<{ qa_status: "passed" | "failed"; qa_message: string | null; photo_id: number }>(
          `/vehicles/${vehiclePublicId}/photos/from-upload`,
          { method: "POST", body: { upload_session_id: uploadSessionId } },
        );
        clearSession(file);
        return {
          status: response.qa_status,
          message: response.qa_message ?? (response.qa_status === "passed" ? "Looks good." : "This shot needs a retake."),
          photoId: response.photo_id,
        };
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Could not upload this photo.";
        return { status: "failed", message, photoId: null };
      }
    },
    [vehiclePublicId, uploadResumable, clearSession],
  );

  return { uploadShot, uploading };
}
