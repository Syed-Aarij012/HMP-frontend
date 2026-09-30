"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import {
  mapApiCvDamageSuggestion,
  mapApiGradingMatrixVersion,
  mapApiInspectionMedia,
  mapApiInspectorVehicle,
  type ApiCvDamageSuggestion,
  type ApiGradingMatrixVersion,
  type ApiInspectionMedia,
  type ApiInspectorVehicle,
} from "@/lib/mapApiInspection";
import type {
  ConditionReportChecklist,
  CvDamageSuggestion,
  DraftDamageItem,
  GradingMatrixVersion,
  InspectionMedia,
  InspectorVehicle,
  SubmittedConditionReport,
} from "@/types/inspection";

type ApiListResponse<T> = { data: T[] };

/** FR-A-013/022/025: the inspector's own internal-detail view of the vehicle being inspected. */
export function useInspectorVehicle(vehiclePublicId: string) {
  const [vehicle, setVehicle] = useState<InspectorVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<{ data: ApiInspectorVehicle }>(`/vehicles/${vehiclePublicId}`)
      .then((response) => {
        if (!cancelled) {
          setVehicle(mapApiInspectorVehicle(response.data));
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this vehicle. Check the ID and that you have inspector access.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [vehiclePublicId]);

  return { vehicle, loading, error };
}

/** FR-A-013/025: a vehicle's own media, so damage can be pinned to a real photo frame. */
export function useVehicleMedia(vehiclePublicId: string) {
  const [media, setMedia] = useState<InspectionMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiListResponse<ApiInspectionMedia>>(`/vehicles/${vehiclePublicId}/media`)
      .then((response) => {
        if (!cancelled) {
          setMedia(response.data.map(mapApiInspectionMedia).filter((m) => m.type !== "video"));
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this vehicle's photos from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [vehiclePublicId]);

  return { media, loading, error };
}

/** FR-A-025: CV-proposed damage — proposals only, never a grade on their own. */
export function useCvDamageSuggestions(vehiclePublicId: string) {
  const [suggestions, setSuggestions] = useState<CvDamageSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiListResponse<ApiCvDamageSuggestion>>(`/vehicles/${vehiclePublicId}/damage-suggestions`)
      .then((response) => {
        if (!cancelled) setSuggestions(response.data.map(mapApiCvDamageSuggestion));
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [vehiclePublicId]);

  return { suggestions, loading };
}

/** FR-A-021: the currently active grading matrix — the only valid panel/damage_type/severity combos. */
export function useActiveGradingMatrix() {
  const [matrix, setMatrix] = useState<GradingMatrixVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<{ data: ApiGradingMatrixVersion }>("/grading-matrix-versions/active")
      .then((response) => {
        if (!cancelled) {
          setMatrix(mapApiGradingMatrixVersion(response.data));
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("No active grading matrix is published yet — ask a Quality Supervisor to publish one.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { matrix, loading, error };
}

/** FR-A-020/022/023: submitting the draft condition report, then publishing it. */
export function useConditionReportSubmission(vehicleNumericId: number | null) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [report, setReport] = useState<SubmittedConditionReport | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const submit = useCallback(
    async (
      vehicleCategory: string,
      checklist: ConditionReportChecklist,
      damageItems: DraftDamageItem[],
      bevExtras?: { sohPercentage: number; chargeCableInventory: string[] },
    ): Promise<boolean> => {
      if (!vehicleNumericId) return false;

      setSubmitting(true);
      setSubmitError(null);
      try {
        const response = await apiFetch<{ data: { id: number; status: string; condition_grade: number | null; mechanical_grade: string | null } }>(
          "/condition-reports",
          {
            method: "POST",
            body: {
              vehicle_master_record_id: vehicleNumericId,
              vehicle_category: vehicleCategory,
              checklist,
              soh_percentage: bevExtras?.sohPercentage,
              charge_cable_inventory: bevExtras?.chargeCableInventory,
              damage_items: damageItems.map((item) => ({
                panel: item.panel,
                damage_type: item.damageType,
                severity: item.severity,
                vehicle_media_id: item.vehicleMediaId ?? undefined,
                frame_x: item.frameX ?? undefined,
                frame_y: item.frameY ?? undefined,
                cv_suggested: item.cvSuggested,
              })),
            },
          },
        );
        setReport({
          id: response.data.id,
          status: response.data.status,
          conditionGrade: response.data.condition_grade,
          mechanicalGrade: response.data.mechanical_grade,
        });
        return true;
      } catch (err) {
        setSubmitError(describeApiError(err, "Could not submit this condition report."));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [vehicleNumericId],
  );

  const publish = useCallback(async (): Promise<boolean> => {
    if (!report) return false;

    setPublishing(true);
    setPublishError(null);
    try {
      const response = await apiFetch<{ data: { id: number; status: string; condition_grade: number | null; mechanical_grade: string | null } }>(
        `/condition-reports/${report.id}/publish`,
        { method: "POST" },
      );
      setReport({
        id: response.data.id,
        status: response.data.status,
        conditionGrade: response.data.condition_grade,
        mechanicalGrade: response.data.mechanical_grade,
      });
      return true;
    } catch (err) {
      setPublishError(describeApiError(err, "Could not publish this condition report."));
      return false;
    } finally {
      setPublishing(false);
    }
  }, [report]);

  return { submit, submitting, submitError, report, publish, publishing, publishError };
}
