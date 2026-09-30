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
};
