"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiGradingMatrixVersion, type ApiGradingMatrixVersion } from "@/lib/mapApiInspection";
import type { GradingMatrixVersion } from "@/types/inspection";

export type DraftPayload = {
  versionLabel: string;
  effectiveFrom: string;
  gradeThresholds: { max_points: number | null; grade: number }[];
  entries: { damage_type: string; panel: string; severity: string; repair_cost_band: string; points: number }[];
};

/**
 * FR-A-021: everything the grading matrix page needs — the live matrix, the published history
 * (including any version scheduled to take over), versions awaiting a second approval — plus
 * drafting and approving. One reload refreshes all of it.
 */
export function useGradingMatrixWorkspace() {
  const [active, setActive] = useState<GradingMatrixVersion | null>(null);
  const [versions, setVersions] = useState<GradingMatrixVersion[]>([]);
  const [pending, setPending] = useState<GradingMatrixVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [activeResult, published, awaiting] = await Promise.all([
        // 404 just means nothing is live yet — a normal state, not an error.
        apiFetch<{ data: ApiGradingMatrixVersion }>("/grading-matrix-versions/active").catch((err) => {
          if (err instanceof ApiError && err.status === 404) return null;
          throw err;
        }),
        apiFetch<{ data: ApiGradingMatrixVersion[] }>("/grading-matrix-versions"),
        apiFetch<{ data: ApiGradingMatrixVersion[] }>("/grading-matrix-versions/pending"),
      ]);
      setActive(activeResult ? mapApiGradingMatrixVersion(activeResult.data) : null);
      setVersions(published.data.map(mapApiGradingMatrixVersion));
      setPending(awaiting.data.map(mapApiGradingMatrixVersion));
      setError(null);
    } catch (err) {
      setError(describeApiError(err, "Could not load the grading matrix."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const draft = useCallback(
    async (payload: DraftPayload): Promise<boolean> => {
      setDrafting(true);
      setDraftError(null);
      try {
        await apiFetch("/grading-matrix-versions", {
          method: "POST",
          body: { version_label: payload.versionLabel, effective_from: payload.effectiveFrom, grade_thresholds: payload.gradeThresholds, entries: payload.entries },
        });
        await load();
        return true;
      } catch (err) {
        setDraftError(describeApiError(err, "Could not submit this version."));
        return false;
      } finally {
        setDrafting(false);
      }
    },
    [load],
  );

  const approve = useCallback(
    async (versionId: number): Promise<boolean> => {
      setApprovingId(versionId);
      setApproveError(null);
      try {
        await apiFetch(`/grading-matrix-versions/${versionId}/approve`, { method: "POST" });
        await load();
        return true;
      } catch (err) {
        setApproveError(describeApiError(err, "Could not approve this version."));
        return false;
      } finally {
        setApprovingId(null);
      }
    },
    [load],
  );

  return { active, versions, pending, loading, error, reload: load, draft, drafting, draftError, approve, approvingId, approveError };
}
