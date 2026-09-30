"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiVehicleRoutingRule, type ApiVehicleRoutingRule } from "@/lib/mapApiRoutingRules";
import type { RoutingRuleAction, RoutingRuleCondition, VehicleRoutingRule } from "@/types/routingRules";

/** FR-A-032: the active auto-routing rule set, plus creating a new rule. */
export function useRoutingRules() {
  const [rules, setRules] = useState<VehicleRoutingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<ApiVehicleRoutingRule[]>("/vehicle-routing-rules")
      .then((response) => {
        setRules(response.map(mapApiVehicleRoutingRule));
        setError(null);
      })
      .catch(() => setError("Could not load routing rules."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const create = useCallback(
    async (name: string, priority: number, conditions: RoutingRuleCondition[], action: RoutingRuleAction): Promise<boolean> => {
      setCreating(true);
      setCreateError(null);
      try {
        await apiFetch("/vehicle-routing-rules", {
          method: "POST",
          body: {
            name,
            priority,
            conditions: conditions.map((c) => ({ field: c.field, operator: c.operator, value: c.value })),
            action: { channel: action.channel, reserve_discount_pct: action.reserveDiscountPct ?? undefined },
          },
        });
        load();
        return true;
      } catch (err) {
        setCreateError(describeApiError(err, "Could not create this routing rule."));
        return false;
      } finally {
        setCreating(false);
      }
    },
    [load],
  );

  return { rules, loading, error, create, creating, createError };
}

/** FR-A-032: manually trigger auto-routing for a specific vehicle. */
export function useApplyRoutingRule() {
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [result, setResult] = useState<{ routedToChannel: string; routedToId: number } | null>(null);

  const apply = useCallback(async (vehiclePublicId: string): Promise<boolean> => {
    setApplying(true);
    setApplyError(null);
    setResult(null);
    try {
      const response = await apiFetch<{ routed_to_channel: string; routed_to_id: number }>(`/vehicles/${vehiclePublicId}/auto-route`, {
        method: "POST",
      });
      setResult({ routedToChannel: response.routed_to_channel, routedToId: response.routed_to_id });
      return true;
    } catch (err) {
      setApplyError(describeApiError(err, "Could not auto-route this vehicle."));
      return false;
    } finally {
      setApplying(false);
    }
  }, []);

  return { apply, applying, applyError, result };
}
