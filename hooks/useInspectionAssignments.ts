"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";

export type InspectionAssignment = {
  id: number;
  status: "assigned" | "completed" | "cancelled";
  note: string | null;
  vehicle: { id: string; title: string; vrm: string | null };
  inspector: { id: number; name: string } | null;
  assigned_by: string | null;
  assigned_at: string | null;
  completed_at: string | null;
};

/**
 * SRS §2.2 P6: inspections are assigned tasks. An inspector gets their own list; a Quality
 * Supervisor / Super Admin gets everyone's, and can assign or cancel.
 */
export function useInspectionAssignments(status?: string, page = 1) {
  const [assignments, setAssignments] = useState<InspectionAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paging, setPaging] = useState({ lastPage: 1, total: 0 });

  const load = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (status) query.set("status", status);
      if (page > 1) query.set("page", String(page));
      const qs = query.toString() ? `?${query.toString()}` : "";
      const response = await apiFetch<{ data: InspectionAssignment[]; meta?: { last_page: number; total: number } }>(`/inspection-assignments${qs}`);
      setAssignments(response.data);
      setPaging({ lastPage: response.meta?.last_page ?? 1, total: response.meta?.total ?? response.data.length });
      setError(null);
    } catch (err) {
      setError(describeApiError(err, "Could not load inspection tasks."));
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  return { assignments, loading, error, reload: load, lastPage: paging.lastPage, total: paging.total };
}
