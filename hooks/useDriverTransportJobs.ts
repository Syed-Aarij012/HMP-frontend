"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { useResumableUpload } from "@/hooks/useResumableUpload";
import type { TransportJob } from "@/types/postSale";

type ApiListResponse<T> = { data: T[] };
type ApiCompletedUpload = { assembled_url: string | null };

/**
 * FR-F-002/F-001: GET /transport-jobs already scopes itself per viewer server-side
 * (TransportJobController::index) — a carrier driver sees only their own carrier's
 * assigned jobs, logistics staff see every job, and a plain buyer sees their own orders'
 * jobs across both trade and retail. This one hook covers all three: the driver actions
 * (collect/deliver/position/exception — see /my-transport-jobs) and the buyer action
 * (consolidate — see /my-transport) nothing in the frontend reached before.
 */
export function useMyTransportJobs() {
  const [jobs, setJobs] = useState<TransportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { upload, clearSession } = useResumableUpload();

  const load = useCallback(() => {
    apiFetch<ApiListResponse<TransportJob>>("/transport-jobs")
      .then((response) => {
        setJobs(response.data);
        setError(null);
      })
      .catch(() => setError("Could not load your transport jobs from the server."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  /**
   * Uploads every photo through the same resumable-chunk session the vehicle-media flows
   * use, then resolves each to its final hosted URL — collect/deliver take an array of
   * already-hosted photo URLs, not raw files.
   */
  const uploadPhotos = useCallback(
    async (files: File[]): Promise<string[]> => {
      const urls: string[] = [];
      for (const file of files) {
        const sessionId = await upload(file);
        if (!sessionId) throw new Error(`${file.name} could not be uploaded. Please try again.`);
        const completed = await apiFetch<{ data: ApiCompletedUpload }>(`/uploads/${sessionId}/complete`, { method: "POST" });
        if (!completed.data.assembled_url) throw new Error(`${file.name} did not finish uploading. Please try again.`);
        urls.push(completed.data.assembled_url);
        clearSession(file);
      }
      return urls;
    },
    [upload, clearSession],
  );

  const currentPosition = useCallback((): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => resolve(null),
        { timeout: 10000 },
      );
    });
  }, []);

  const run = useCallback(
    async (jobId: number, action: () => Promise<TransportJob>): Promise<boolean> => {
      setActionError(null);
      setBusyId(jobId);
      try {
        const job = await action();
        setJobs((previous) => previous.map((existing) => (existing.id === job.id ? job : existing)));
        return true;
      } catch (err) {
        setActionError(describeApiError(err, "That action could not be completed."));
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [],
  );

  const collect = useCallback(
    (jobId: number, photoFiles: File[]) =>
      run(jobId, async () => {
        const photos = await uploadPhotos(photoFiles);
        const position = await currentPosition();
        const response = await apiFetch<{ data: TransportJob }>(`/transport-jobs/${jobId}/collect`, {
          method: "POST",
          body: { photos, gps_lat: position?.lat ?? null, gps_lng: position?.lng ?? null },
        });
        return response.data;
      }),
    [run, uploadPhotos, currentPosition],
  );

  const deliver = useCallback(
    (jobId: number, photoFiles: File[], signedBy: string) =>
      run(jobId, async () => {
        const photos = await uploadPhotos(photoFiles);
        const response = await apiFetch<{ data: TransportJob }>(`/transport-jobs/${jobId}/deliver`, {
          method: "POST",
          body: { photos, signed_by: signedBy },
        });
        return response.data;
      }),
    [run, uploadPhotos],
  );

  const updatePosition = useCallback(
    (jobId: number) =>
      run(jobId, async () => {
        const position = await currentPosition();
        if (!position) throw new Error("Could not read your device's location.");
        const response = await apiFetch<{ data: TransportJob }>(`/transport-jobs/${jobId}/position`, {
          method: "POST",
          body: { gps_lat: position.lat, gps_lng: position.lng },
        });
        return response.data;
      }),
    [run, currentPosition],
  );

  const reportException = useCallback(
    (jobId: number, exceptionCode: string, notes: string) =>
      run(jobId, async () => {
        const response = await apiFetch<{ data: TransportJob }>(`/transport-jobs/${jobId}/exception`, {
          method: "POST",
          body: { exception_code: exceptionCode, notes: notes || null },
        });
        return response.data;
      }),
    [run],
  );

  const [consolidating, setConsolidating] = useState(false);

  /**
   * FR-F-001: "consolidated multi-vehicle moves for trade buyers" — combines 2+ of the
   * buyer's own still-quoted/booked jobs (LogisticsService::consolidate()) into one trip
   * under a shared consolidation_group_id, discounting every job after the first.
   */
  const consolidate = useCallback(async (jobIds: number[]): Promise<boolean> => {
    setActionError(null);
    setConsolidating(true);
    try {
      const response = await apiFetch<ApiListResponse<TransportJob>>("/transport-jobs/consolidate", {
        method: "POST",
        body: { transport_job_ids: jobIds },
      });
      const updated = new Map(response.data.map((job) => [job.id, job]));
      setJobs((previous) => previous.map((existing) => updated.get(existing.id) ?? existing));
      return true;
    } catch (err) {
      setActionError(describeApiError(err, "Those jobs could not be consolidated."));
      return false;
    } finally {
      setConsolidating(false);
    }
  }, []);

  return { jobs, loading, error, actionError, busyId, collect, deliver, updatePosition, reportException, consolidate, consolidating };
}
