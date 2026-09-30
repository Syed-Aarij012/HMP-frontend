import type { RoutingRuleAction, RoutingRuleCondition, VehicleRoutingRule } from "@/types/routingRules";

export type ApiRoutingRuleCondition = { field: string; operator: string; value: string | number };
export type ApiRoutingRuleAction = { channel: string; reserve_discount_pct: number | null };

export type ApiVehicleRoutingRule = {
  id: number;
  name: string;
  priority: number;
  is_active: boolean;
  conditions: ApiRoutingRuleCondition[];
  action: ApiRoutingRuleAction;
};

export function mapApiVehicleRoutingRule(api: ApiVehicleRoutingRule): VehicleRoutingRule {
  return {
    id: api.id,
    name: api.name,
    priority: api.priority,
    isActive: api.is_active,
    conditions: (api.conditions ?? []).map(
      (c): RoutingRuleCondition => ({
        field: c.field as RoutingRuleCondition["field"],
        operator: c.operator as RoutingRuleCondition["operator"],
        value: String(c.value),
      }),
    ),
    action: {
      channel: api.action.channel as RoutingRuleAction["channel"],
      reserveDiscountPct: api.action.reserve_discount_pct,
    },
  };
}
