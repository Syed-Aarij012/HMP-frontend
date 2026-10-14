// FR-A-032: rule-based auto-routing (e.g. "part-exchange, age > 8yrs -> consign to auction").

export const ROUTING_RULE_FIELDS = ["vehicle_age_years", "condition_grade", "acquisition_source", "current_mileage"] as const;
export const ROUTING_RULE_OPERATORS = [">", ">=", "<", "<=", "=", "!="] as const;
export const ROUTING_RULE_CHANNELS = ["auction_lot", "fixed_price"] as const;

export type RoutingRuleCondition = {
  field: (typeof ROUTING_RULE_FIELDS)[number];
  operator: (typeof ROUTING_RULE_OPERATORS)[number];
  value: string;
};

export type RoutingRuleAction = {
  channel: (typeof ROUTING_RULE_CHANNELS)[number];
  reserveDiscountPct: number | null;
};

export type VehicleRoutingRule = {
  id: number;
  name: string;
  priority: number;
  isActive: boolean;
  conditions: RoutingRuleCondition[];
  action: RoutingRuleAction;
  /** How many vehicles this rule has routed so far. */
  applicationsCount: number;
};

/** One rule checked against one vehicle (GET /vehicles/{id}/auto-route/preview). */
export type RulePreviewCondition = { field: string; operator: string; value: string | number; actual: string | number | null; passed: boolean };

export type RulePreview = {
  id: number;
  name: string;
  priority: number;
  isActive: boolean;
  action: RoutingRuleAction;
  matched: boolean;
  wins: boolean;
  conditions: RulePreviewCondition[];
};

export type RoutingPreview = {
  vehicle: { id: string; title: string; vrm: string | null; currentChannel: string };
  facts: Record<string, string | number | null>;
  rules: RulePreview[];
  winningRuleId: number | null;
  blockers: string[];
};

export type RoutingActivityItem = { id: number; rule: string | null; channel: string; vehicle: string; vrm: string | null; at: string | null };
