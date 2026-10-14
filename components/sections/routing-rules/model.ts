import type { RoutingRuleAction, RoutingRuleCondition } from "@/types/routingRules";

/*
 * Auto-routing rules in plain English (FR-A-032): "If the car is over 8 years old and grade 4 or
 * worse, then send it to the next auction, reserve 5% below its valuation". Rules are tried top to
 * bottom; the first active rule whose conditions all match wins.
 */

export type Field = RoutingRuleCondition["field"];
export type Operator = RoutingRuleCondition["operator"];
export type Channel = RoutingRuleAction["channel"];

export const FIELDS: { value: Field; label: string; unit?: string; hint: string }[] = [
  { value: "vehicle_age_years", label: "Vehicle age", unit: "years", hint: "Years since its model year" },
  { value: "condition_grade", label: "Condition grade", hint: "1 is best, 5 is worst" },
  { value: "acquisition_source", label: "Where it came from", hint: "How we got the car, e.g. part-exchange" },
  { value: "current_mileage", label: "Mileage", unit: "miles", hint: "Current odometer reading" },
];

export const fieldLabel = (field: string) => FIELDS.find((f) => f.value === field)?.label ?? field.replace(/_/g, " ");

const NUMERIC_OPERATORS: { value: Operator; label: string }[] = [
  { value: ">", label: "is more than" },
  { value: ">=", label: "is at least" },
  { value: "<", label: "is less than" },
  { value: "<=", label: "is at most" },
  { value: "=", label: "is exactly" },
  { value: "!=", label: "is not" },
];

const TEXT_OPERATORS: { value: Operator; label: string }[] = [
  { value: "=", label: "is" },
  { value: "!=", label: "is not" },
];

export const operatorsFor = (field: Field) => (field === "acquisition_source" ? TEXT_OPERATORS : NUMERIC_OPERATORS);

export const SOURCES: { value: string; label: string }[] = [
  { value: "part_exchange", label: "Part-exchange" },
  { value: "trade_in", label: "Trade-in" },
];

export const sourceLabel = (value: string) => SOURCES.find((s) => s.value === value)?.label ?? value.replace(/_/g, " ");

export const GRADE_OPTIONS = [
  { value: "1", label: "1 (best)" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5 (worst)" },
];

export const CHANNELS: { value: Channel; label: string; text: string; discountLabel: string }[] = [
  { value: "auction_lot", label: "Auction lot", text: "Consign it to the next scheduled trade sale.", discountLabel: "Reserve price" },
  { value: "fixed_price", label: "Fixed-price trade", text: "List it for instant Buy Now purchase by the trade.", discountLabel: "Asking price" },
];

export const channelLabel = (channel: string) => CHANNELS.find((c) => c.value === channel)?.label ?? channel.replace(/_/g, " ");

export const NEW_CONDITION: RoutingRuleCondition = { field: "vehicle_age_years", operator: ">", value: "8" };

export function defaultValue(field: Field): string {
  return field === "condition_grade" ? "4" : field === "acquisition_source" ? "part_exchange" : field === "current_mileage" ? "100000" : "8";
}

// ------------------------------------------------------------------ Reading a rule aloud

const numberWord = (operator: Operator) => NUMERIC_OPERATORS.find((o) => o.value === operator)?.label ?? operator;

/** "is over 8 years old", "has a grade of 4 or worse", "came from part-exchange". */
export function describeCondition(condition: { field: string; operator: string; value: string | number }): string {
  const value = String(condition.value);
  const op = condition.operator as Operator;

  switch (condition.field) {
    case "vehicle_age_years":
      return `its age ${numberWord(op)} ${value} year${value === "1" ? "" : "s"}`;
    case "current_mileage":
      return `its mileage ${numberWord(op)} ${Number(value).toLocaleString("en-GB")} miles`;
    case "condition_grade": {
      const phrase: Record<string, string> = {
        ">": `worse than grade ${value}`,
        ">=": `grade ${value} or worse`,
        "<": `better than grade ${value}`,
        "<=": `grade ${value} or better`,
        "=": `exactly grade ${value}`,
        "!=": `not grade ${value}`,
      };
      return `its condition grade is ${phrase[op] ?? value}`;
    }
    case "acquisition_source":
      return op === "!=" ? `it did not come from ${sourceLabel(value).toLowerCase()}` : `it came from ${sourceLabel(value).toLowerCase()}`;
    default:
      return `${fieldLabel(condition.field).toLowerCase()} ${numberWord(op)} ${value}`;
  }
}

export const percent = (fraction: number | null) => (fraction === null ? null : Math.round(fraction * 1000) / 10);

export function describeAction(action: { channel: string; reserveDiscountPct: number | null }): string {
  const where = action.channel === "fixed_price" ? "list it at a fixed price for the trade" : "consign it to the next scheduled auction";
  const pct = percent(action.reserveDiscountPct);
  if (pct === null) return `${where}, with no reserve set`;
  const what = action.channel === "fixed_price" ? "asking price" : "reserve";
  return pct === 0 ? `${where}, ${what} at its valuation` : `${where}, ${what} ${pct}% below its valuation`;
}

export function describeRule(rule: { conditions: { field: string; operator: string; value: string | number }[]; action: { channel: string; reserveDiscountPct: number | null } }): string {
  const when = rule.conditions.map(describeCondition).join(" and ");
  return `If ${when}, then ${describeAction(rule.action)}.`;
}

// ------------------------------------------------------------------ Validation

export type RuleProblem = { message: string; conditionIndex?: number };

export function validateRule(draft: { name: string; conditions: RoutingRuleCondition[]; action: { channel: Channel; reserveDiscountPct: number | null } }, discountText: string): RuleProblem[] {
  const problems: RuleProblem[] = [];
  if (!draft.name.trim()) problems.push({ message: "Give the rule a name." });
  if (draft.conditions.length === 0) problems.push({ message: "Add at least one condition." });

  draft.conditions.forEach((condition, index) => {
    const value = condition.value.trim();
    if (condition.field === "acquisition_source") {
      if (!value) problems.push({ conditionIndex: index, message: "Say where the vehicle came from." });
    } else if (value === "" || !Number.isFinite(Number(value)) || Number(value) < 0) {
      problems.push({ conditionIndex: index, message: "Enter a number, 0 or more." });
    } else if (condition.field === "condition_grade" && (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 5)) {
      problems.push({ conditionIndex: index, message: "A grade is 1 to 5." });
    }
  });

  const discount = discountText.trim();
  if (discount !== "" && (!Number.isFinite(Number(discount)) || Number(discount) < 0 || Number(discount) > 95)) {
    problems.push({ message: "The discount must be between 0% and 95%." });
  }
  if (draft.action.channel === "fixed_price" && discount === "") {
    problems.push({ message: "A fixed-price rule needs a discount — the asking price is worked out from the vehicle's valuation." });
  }
  return problems;
}
