"use client";

import { useCallback, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { useResumableUpload } from "@/hooks/useResumableUpload";
import type { ReleaseNote } from "@/types/postSale";

type ApiCompletedUpload = { assembled_url: string | null };

/**
 * FR-F-010: the gate app — a collector presents their release code (and photo ID); gate
 * staff look the note up by that code (there's no other way to find it — they're never
 * shown the note's own numeric id), then execute the release once the code matches, a photo
 * of the ID is captured, and the handover checklist is complete. Previously this whole flow
 * existed only as raw API endpoints (ReleaseNoteController) with no UI reaching them at all.
 */
export function useGateRelease() {
  const [releaseNote, setReleaseNote] = useState<ReleaseNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const { upload, clearSession } = useResumableUpload();

  const lookup = useCallback(async (code: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setReleaseNote(null);
    try {
      const response = await apiFetch<{ data: ReleaseNote }>(`/release-notes/lookup?release_code=${encodeURIComponent(code)}`);
      setReleaseNote(response.data);
      return true;
    } catch (err) {
      setError(describeApiError(err, "No release note matches that code."));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const execute = useCallback(
    async (releaseCode: string, photoIdFile: File, checklist: Record<string, boolean>): Promise<boolean> => {
      if (!releaseNote) return false;
      setExecuting(true);
      setError(null);
      try {
        const sessionId = await upload(photoIdFile);
        if (!sessionId) throw new Error("The photo ID could not be uploaded. Please try again.");
        const completed = await apiFetch<{ data: ApiCompletedUpload }>(`/uploads/${sessionId}/complete`, { method: "POST" });
        if (!completed.data.assembled_url) throw new Error("The photo ID did not finish uploading. Please try again.");
        clearSession(photoIdFile);

        const response = await apiFetch<{ data: ReleaseNote }>(`/release-notes/${releaseNote.id}/execute`, {
          method: "POST",
          body: {
            release_code: releaseCode,
            photo_id_capture_url: completed.data.assembled_url,
            handover_checklist: checklist,
          },
        });
        setReleaseNote(response.data);
        return true;
      } catch (err) {
        setError(describeApiError(err, err instanceof Error ? err.message : "This vehicle could not be released."));
        return false;
      } finally {
        setExecuting(false);
      }
    },
    [releaseNote, upload, clearSession],
  );

  const reset = useCallback(() => {
    setReleaseNote(null);
    setError(null);
  }, []);

  return { releaseNote, loading, error, executing, lookup, execute, reset };
}
