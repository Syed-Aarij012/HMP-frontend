"use client";

import { useCallback, useEffect, useState } from "react";
import { useResumableUpload } from "@/hooks/useResumableUpload";
import { apiFetch, describeApiError, downloadFile } from "@/lib/api-client";

export type VehicleDocumentRow = {
  id: number;
  type: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

/**
 * The documents a seller attaches to their vehicle (V5C, MOT, service history) — what the listing
 * moderator checks before approving it (FR-C-001). Uploads go through the resumable chunked
 * sessions, so a scan bigger than PHP's per-request upload limit still gets through, and are kept
 * on private storage.
 */
export function useVehicleDocuments(vehiclePublicId: string) {
  const { upload, clearSession, progress } = useResumableUpload();
  const [documents, setDocuments] = useState<VehicleDocumentRow[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await apiFetch<{ data: VehicleDocumentRow[]; types: string[] }>(`/vehicles/${vehiclePublicId}/documents`);
      setDocuments(response.data);
      setTypes(response.types);
    } catch (err) {
      setError(describeApiError(err, "Could not load your documents."));
    } finally {
      setLoading(false);
    }
  }, [vehiclePublicId]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const add = useCallback(
    async (file: File, type: string) => {
      setBusy(true);
      setError(null);
      try {
        const sessionId = await upload(file);
        if (!sessionId) throw new Error(`${file.name} could not be uploaded. Please try again.`);
        await apiFetch(`/vehicles/${vehiclePublicId}/documents/from-upload`, {
          method: "POST",
          body: { upload_session_id: sessionId, type },
        });
        clearSession(file);
        await load();
      } catch (err) {
        setError(describeApiError(err, err instanceof Error ? err.message : "That document could not be uploaded."));
      } finally {
        setBusy(false);
      }
    },
    [vehiclePublicId, upload, clearSession, load],
  );

  const remove = useCallback(
    async (id: number) => {
      setError(null);
      try {
        await apiFetch(`/vehicle-documents/${id}`, { method: "DELETE" });
        await load();
      } catch (err) {
        setError(describeApiError(err, "Could not remove that document."));
      }
    },
    [load],
  );

  const download = useCallback(async (doc: VehicleDocumentRow) => {
    try {
      await downloadFile(`/vehicle-documents/${doc.id}/download`, doc.original_name);
    } catch (err) {
      setError(describeApiError(err, "Could not download that document."));
    }
  }, []);

  return { documents, types, loading, busy, progress, error, add, remove, download };
}
