import type { RoutingPreview, RoutingRuleAction, RoutingRuleCondition, VehicleRoutingRule } from "@/types/routingRules";

export type ApiRoutingRuleCondition = { field: string; operator: string; value: string | number };
export type ApiRoutingRuleAction = { channel: string; reserve_discount_pct: number | null };

export type ApiVehicleRoutingRule = {
  id: number;
  name: string;
  priority: number;
  is_active: boolean;
  conditions: ApiRoutingRuleCondition[];
  action: ApiRoutingRuleAction;
  applications_count?: number;
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
      reserveDiscountPct: api.action.reserve_discount_pct ?? null,
    },
    applicationsCount: api.applications_count ?? 0,
  };
}

export type ApiRoutingPreview = {
  vehicle: { id: string; title: string; vrm: string | null; current_channel: string };
  facts: Record<string, string | number | null>;
  rules: {
    id: number;
    name: string;
    priority: number;
    is_active: boolean;
    action: ApiRoutingRuleAction;
    matched: boolean;
    wins: boolean;
    conditions: { field: string; operator: string; value: string | number; actual: string | number | null; passed: boolean }[];
  }[];
  winning_rule_id: number | null;
  blockers: string[];
};

export function mapApiRoutingPreview(api: ApiRoutingPreview): RoutingPreview {
  return {
    vehicle: { id: api.vehicle.id, title: api.vehicle.title, vrm: api.vehicle.vrm, currentChannel: api.vehicle.current_channel },
    facts: api.facts,
    rules: api.rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      priority: rule.priority,
      isActive: rule.is_active,
      action: { channel: rule.action.channel as RoutingRuleAction["channel"], reserveDiscountPct: rule.action.reserve_discount_pct ?? null },
      matched: rule.matched,
      wins: rule.wins,
      conditions: rule.conditions,
    })),
    winningRuleId: api.winning_rule_id,
    blockers: api.blockers,
  };
}
