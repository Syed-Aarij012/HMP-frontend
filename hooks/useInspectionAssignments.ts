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
export function useInspectionAssignments(status?: string) {
  const [assignments, setAssignments] = useState<InspectionAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const qs = status ? `?status=${status}` : "";
      setAssignments((await apiFetch<{ data: InspectionAssignment[] }>(`/inspection-assignments${qs}`)).data);
      setError(null);
    } catch (err) {
      setError(describeApiError(err, "Could not load inspection tasks."));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  return { assignments, loading, error, reload: load };
}
