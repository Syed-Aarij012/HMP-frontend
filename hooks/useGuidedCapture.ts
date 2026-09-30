"use client";

import { useCallback, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";

export type ShotUploadResult = {
  status: "passed" | "failed";
  message: string;
  photoId: number | null;
};

/** FR-A-014: uploads one guided-capture shot and returns the real, synchronous QA verdict for it. */
export function useGuidedCapture(vehiclePublicId: string) {
  const [uploading, setUploading] = useState(false);

  const uploadShot = useCallback(
    async (file: File): Promise<ShotUploadResult> => {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("photo", file);
        const response = await apiFetch<{ qa_status: "passed" | "failed"; qa_message: string | null; photo_id: number }>(
          `/vehicles/${vehiclePublicId}/photos`,
          { method: "POST", body: formData },
        );
        return {
          status: response.qa_status,
          message: response.qa_message ?? (response.qa_status === "passed" ? "Looks good." : "This shot needs a retake."),
          photoId: response.photo_id,
        };
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Could not upload this photo.";
        return { status: "failed", message, photoId: null };
      } finally {
        setUploading(false);
      }
    },
    [vehiclePublicId],
  );

  return { uploadShot, uploading };
}
