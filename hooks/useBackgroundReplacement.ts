"use client";

import { useCallback, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";

/** FR-A-015: opt-in background replacement preview for one already-uploaded photo. */
export function useBackgroundReplacement(vehiclePublicId: string) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const replace = useCallback(
    async (photoId: number, backgroundColor: string): Promise<string | null> => {
      setProcessing(true);
      setError(null);
      try {
        const response = await apiFetch<{ data: { background_replaced_url: string } }>(
          `/vehicles/${vehiclePublicId}/photos/${photoId}/background-replacement`,
          { method: "POST", body: { background_color: backgroundColor } },
        );
        return response.data.background_replaced_url;
      } catch (err) {
        setError(describeApiError(err, "Could not replace this photo's background."));
        return null;
      } finally {
        setProcessing(false);
      }
    },
    [vehiclePublicId],
  );

  return { replace, processing, error };
}
