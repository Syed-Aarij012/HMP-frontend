"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "@/lib/api-client";

// FR-A-010: fixed-size chunks — small enough that a single chunk failure on a flaky
// connection costs seconds to retry, not minutes.
const CHUNK_SIZE = 2 * 1024 * 1024;
const MAX_RETRIES_PER_CHUNK = 3;

type ApiUploadSession = {
  id: string;
  total_chunks: number;
  missing_chunks: number[];
  status: "pending" | "completed";
};

function fingerprintFor(file: File): string {
  return `hmp_upload_session:${file.name}:${file.size}:${file.lastModified}`;
}

async function uploadChunk(sessionId: string, index: number, blob: Blob): Promise<void> {
  const formData = new FormData();
  formData.append("index", String(index));
  formData.append("chunk", blob);

  for (let attempt = 1; attempt <= MAX_RETRIES_PER_CHUNK; attempt++) {
    try {
      await apiFetch(`/uploads/${sessionId}/chunks`, { method: "POST", body: formData });
      return;
    } catch (err) {
      if (attempt === MAX_RETRIES_PER_CHUNK) throw err;
    }
  }
}

/**
 * FR-A-010: splits a file into chunks and uploads them against a resumable session — if the
 * browser tab reloads mid-upload, calling upload() again with the same file (matched by
 * name/size/lastModified) resumes from whichever chunks already landed, via localStorage.
 */
export function useResumableUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);
    setProgress(0);

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fingerprint = fingerprintFor(file);

    try {
      let sessionId = localStorage.getItem(fingerprint);
      let missingChunks: number[] = Array.from({ length: totalChunks }, (_, i) => i);

      if (sessionId) {
        try {
          const status = await apiFetch<{ data: ApiUploadSession }>(`/uploads/${sessionId}`);
          if (status.data.status === "completed") {
            setProgress(100);
            return sessionId;
          }
          missingChunks = status.data.missing_chunks;
        } catch {
          // The saved session is gone (expired, wrong account, etc.) — start fresh below.
          sessionId = null;
        }
      }

      if (!sessionId) {
        const created = await apiFetch<{ data: ApiUploadSession }>("/uploads", {
          method: "POST",
          body: {
            filename: file.name,
            total_size: file.size,
            total_chunks: totalChunks,
            mime_type: file.type || "application/octet-stream",
          },
        });
        sessionId = created.data.id;
        try {
          localStorage.setItem(fingerprint, sessionId);
        } catch {
          // Storage unavailable — resuming after a reload just won't work; the upload itself still will.
        }
      }

      const alreadyDone = totalChunks - missingChunks.length;
      let completed = alreadyDone;
      setProgress(Math.round((completed / totalChunks) * 100));

      for (const index of missingChunks) {
        const start = index * CHUNK_SIZE;
        const blob = file.slice(start, start + CHUNK_SIZE);
        await uploadChunk(sessionId, index, blob);
        completed++;
        setProgress(Math.round((completed / totalChunks) * 100));
      }

      return sessionId;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const clearSession = useCallback((file: File) => {
    try {
      localStorage.removeItem(fingerprintFor(file));
    } catch {
      // Nothing to clean up if storage isn't available.
    }
  }, []);

  return { upload, uploading, progress, error, clearSession };
}
