"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiRoutingPreview, mapApiVehicleRoutingRule, type ApiRoutingPreview, type ApiVehicleRoutingRule } from "@/lib/mapApiRoutingRules";
import type { RoutingActivityItem, RoutingPreview, RoutingRuleAction, RoutingRuleCondition, VehicleRoutingRule } from "@/types/routingRules";

export type RuleDraft = {
  name: string;
  isActive: boolean;
  conditions: RoutingRuleCondition[];
  action: RoutingRuleAction;
};

export type Outcome = { ok: true } | { ok: false; message: string };

const toBody = (draft: RuleDraft) => ({
  name: draft.name.trim(),
  is_active: draft.isActive,
  conditions: draft.conditions.map((c) => ({ field: c.field, operator: c.operator, value: c.field === "acquisition_source" ? c.value.trim() : Number(c.value) })),
  action: { channel: draft.action.channel, reserve_discount_pct: draft.action.reserveDiscountPct },
});

/**
 * FR-A-032: the auto-routing rule set — list, create, edit, switch on/off, reorder and delete.
 * Mutations report back as { ok } so the screen can show the server's own reason on a refusal.
 */
export function useRoutingRules() {
  const [rules, setRules] = useState<VehicleRoutingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | "new" | "order" | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await apiFetch<ApiVehicleRoutingRule[]>("/vehicle-routing-rules");
      setRules(response.map(mapApiVehicleRoutingRule));
      setError(null);
    } catch (err) {
      setError(describeApiError(err, "Could not load routing rules."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  async function run(id: number | "new" | "order", action: () => Promise<unknown>, fallback: string): Promise<Outcome> {
    setBusyId(id);
    try {
      await action();
      await load();
      return { ok: true };
    } catch (err) {
      return { ok: false, message: describeApiError(err, fallback) };
    } finally {
      setBusyId(null);
    }
  }

  /** New rules go to the end of the order (lowest priority, tried last). */
  const create = (draft: RuleDraft) =>
    run("new", () => apiFetch("/vehicle-routing-rules", { method: "POST", body: { ...toBody(draft), priority: Math.max(0, ...rules.map((r) => r.priority)) + 10 } }), "Could not create this rule.");

  const update = (id: number, draft: RuleDraft) => run(id, () => apiFetch(`/vehicle-routing-rules/${id}`, { method: "PATCH", body: toBody(draft) }), "Could not save this rule.");

  const setActive = (id: number, active: boolean) => run(id, () => apiFetch(`/vehicle-routing-rules/${id}`, { method: "PATCH", body: { is_active: active } }), "Could not change this rule.");

  const remove = (id: number) => run(id, () => apiFetch(`/vehicle-routing-rules/${id}`, { method: "DELETE" }), "Could not delete this rule.");

  const reorder = (ids: number[]) => run("order", () => apiFetch("/vehicle-routing-rules/reorder", { method: "POST", body: { ids } }), "Could not save the new order.");

  return { rules, loading, error, busyId, reload: load, create, update, setActive, remove, reorder };
}

/** Which rule would pick a vehicle — and a way to route it for real. */
export function useRoutingTest(vehiclePublicId: string | null) {
  const [preview, setPreview] = useState<RoutingPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routing, setRouting] = useState(false);
  const [routed, setRouted] = useState<{ channel: string; rule: string | null } | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!vehiclePublicId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      setRouted(null);
      setRouteError(null);
      apiFetch<{ data: ApiRoutingPreview }>(`/vehicles/${vehiclePublicId}/auto-route/preview`)
        .then((response) => {
          if (!cancelled) setPreview(mapApiRoutingPreview(response.data));
        })
        .catch((err) => {
          if (!cancelled) {
            setPreview(null);
            setError(describeApiError(err, "Could not check this vehicle."));
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [vehiclePublicId, attempt]);

  const route = useCallback(async (): Promise<boolean> => {
    if (!vehiclePublicId) return false;
    setRouting(true);
    setRouteError(null);
    try {
      const response = await apiFetch<{ routed_to_channel: string; rule?: { name: string } | null }>(`/vehicles/${vehiclePublicId}/auto-route`, { method: "POST" });
      setRouted({ channel: response.routed_to_channel, rule: response.rule?.name ?? null });
      return true;
    } catch (err) {
      setRouteError(describeApiError(err, "Could not route this vehicle."));
      return false;
    } finally {
      setRouting(false);
    }
  }, [vehiclePublicId]);

  return { preview: vehiclePublicId ? preview : null, loading, error, route, routing, routed, routeError, recheck: () => setAttempt((n) => n + 1) };
}

/** The most recent vehicles the rules have routed. */
export function useRoutingActivity() {
  const [items, setItems] = useState<RoutingActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems((await apiFetch<{ data: RoutingActivityItem[] }>("/vehicle-routing-rules/applications")).data);
      setError(null);
    } catch (err) {
      setError(describeApiError(err, "Could not load recent activity."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  return { items, loading, error, reload: load };
}
