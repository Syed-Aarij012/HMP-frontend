"use client";

import { useId, useState, type FormEvent } from "react";
import { Notice } from "@/components/ui/kit";
import type { Outcome, RuleDraft } from "@/hooks/useRoutingRules";
import type { RoutingRuleCondition, VehicleRoutingRule } from "@/types/routingRules";
import {
  CHANNELS,
  FIELDS,
  GRADE_OPTIONS,
  NEW_CONDITION,
  SOURCES,
  defaultValue,
  describeRule,
  operatorsFor,
  percent,
  validateRule,
  type Channel,
  type Field,
} from "./model";

const EXAMPLES: { label: string; draft: { name: string; conditions: RoutingRuleCondition[]; channel: Channel; discount: string } }[] = [
  { label: "Older cars to auction", draft: { name: "Older cars to auction", conditions: [{ field: "vehicle_age_years", operator: ">", value: "8" }], channel: "auction_lot", discount: "5" } },
  { label: "Poor condition to auction", draft: { name: "Poor condition to auction", conditions: [{ field: "condition_grade", operator: ">=", value: "4" }], channel: "auction_lot", discount: "5" } },
  { label: "High mileage, fixed price", draft: { name: "High mileage at a fixed price", conditions: [{ field: "current_mileage", operator: ">", value: "100000" }], channel: "fixed_price", discount: "10" } },
];

const OTHER = "__other__";

/** The rule editor: name it, say when it applies, say where the car goes. Reads the rule back as a sentence. */
export default function RuleForm({ rule, busy, onSave, onCancel }: {
  rule: VehicleRoutingRule | null;
  busy: boolean;
  onSave: (draft: RuleDraft) => Promise<Outcome>;
  onCancel: () => void;
}) {
  const id = useId();
  const [name, setName] = useState(rule?.name ?? "");
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);
  const [conditions, setConditions] = useState<RoutingRuleCondition[]>(rule?.conditions ?? [{ ...NEW_CONDITION }]);
  const [channel, setChannel] = useState<Channel>(rule?.action.channel ?? "auction_lot");
  const [setDiscount, setSetDiscount] = useState(rule ? rule.action.reserveDiscountPct !== null : true);
  const [discount, setDiscountText] = useState(rule?.action.reserveDiscountPct != null ? String(percent(rule.action.reserveDiscountPct)) : "5");
  const [customSource, setCustomSource] = useState<Record<number, boolean>>({});
  const [showProblems, setShowProblems] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const needsDiscount = channel === "fixed_price";
  const discountOn = needsDiscount || setDiscount;
  const reserveFraction = discountOn && discount.trim() !== "" && Number.isFinite(Number(discount)) ? Number(discount) / 100 : null;
  const draft: RuleDraft = { name, isActive, conditions, action: { channel, reserveDiscountPct: discountOn ? reserveFraction : null } };
  const problems = validateRule(draft, discountOn ? discount : "");
  const channelMeta = CHANNELS.find((c) => c.value === channel)!;

  function patch(index: number, change: Partial<RoutingRuleCondition>) {
    setConditions((current) => current.map((c, i) => (i === index ? { ...c, ...change } : c)));
  }

  function changeField(index: number, field: Field) {
    setCustomSource((current) => ({ ...current, [index]: false }));
    patch(index, { field, operator: field === "acquisition_source" ? "=" : ">", value: defaultValue(field) });
  }

  function applyExample(example: (typeof EXAMPLES)[number]) {
    setName(example.draft.name);
    setConditions(example.draft.conditions.map((c) => ({ ...c })));
    setChannel(example.draft.channel);
    setSetDiscount(true);
    setDiscountText(example.draft.discount);
    setCustomSource({});
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setServerError(null);
    if (problems.length > 0) {
      setShowProblems(true);
      return;
    }
    const outcome = await onSave(draft);
    if (!outcome.ok) setServerError(outcome.message);
  }

  const conditionProblem = (index: number) => (showProblems ? problems.find((p) => p.conditionIndex === index)?.message : undefined);
  const generalProblems = showProblems ? problems.filter((p) => p.conditionIndex === undefined) : [];

  return (
    <form onSubmit={submit} noValidate>
      {!rule && (
        <div className="rr-examples">
          <span className="ha-sub">Start from an example:</span>
          <div className="ha-chips">
            {EXAMPLES.map((example) => (
              <button key={example.label} type="button" className="ha-btn is-sm" onClick={() => applyExample(example)}>
                {example.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="ha-field">
        <label htmlFor={`${id}-name`}>Rule name</label>
        <input id={`${id}-name`} className="ha-input" value={name} maxLength={150} placeholder="e.g. Older cars to auction" aria-invalid={showProblems && !name.trim() ? true : undefined} onChange={(e) => setName(e.target.value)} />
        {showProblems && !name.trim() && <div className="ha-error-text">Give the rule a name.</div>}
      </div>

      <fieldset className="ha-field rr-step">
        <legend>When a vehicle matches <b>all</b> of these…</legend>
        {conditions.map((condition, index) => {
          const meta = FIELDS.find((f) => f.value === condition.field)!;
          const knownSource = SOURCES.some((s) => s.value === condition.value);
          const showOther = customSource[index] || (condition.field === "acquisition_source" && condition.value !== "" && !knownSource);
          const error = conditionProblem(index);
          return (
            <div key={index} className="rr-condition">
              {index > 0 && <span className="rr-and" aria-hidden="true">and</span>}
              <div className="rr-condition-row">
                <select className="ha-select" aria-label={`Condition ${index + 1}: what to check`} value={condition.field} onChange={(e) => changeField(index, e.target.value as Field)}>
                  {FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <select className="ha-select" aria-label={`Condition ${index + 1}: comparison`} value={condition.operator} onChange={(e) => patch(index, { operator: e.target.value as RoutingRuleCondition["operator"] })}>
                  {operatorsFor(condition.field).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="rr-value">
                  {condition.field === "condition_grade" ? (
                    <select className="ha-select" aria-label={`Condition ${index + 1}: grade`} value={condition.value} onChange={(e) => patch(index, { value: e.target.value })}>
                      {GRADE_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  ) : condition.field === "acquisition_source" ? (
                    <>
                      <select
                        className="ha-select"
                        aria-label={`Condition ${index + 1}: source`}
                        value={showOther ? OTHER : condition.value}
                        onChange={(e) => {
                          if (e.target.value === OTHER) {
                            setCustomSource((current) => ({ ...current, [index]: true }));
                            patch(index, { value: "" });
                          } else {
                            setCustomSource((current) => ({ ...current, [index]: false }));
                            patch(index, { value: e.target.value });
                          }
                        }}
                      >
                        {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        <option value={OTHER}>Something else…</option>
                      </select>
                      {showOther && (
                        <input className="ha-input mt-2" aria-label={`Condition ${index + 1}: other source`} placeholder="e.g. auction_purchase" value={condition.value} onChange={(e) => patch(index, { value: e.target.value.toLowerCase().trim().replace(/\s+/g, "_") })} autoFocus />
                      )}
                    </>
                  ) : (
                    <div className="rr-unit">
                      <input type="number" min={0} step={1} inputMode="numeric" className="ha-input" aria-label={`Condition ${index + 1}: value`} aria-invalid={error ? true : undefined} value={condition.value} onChange={(e) => patch(index, { value: e.target.value })} />
                      {meta.unit && <span>{meta.unit}</span>}
                    </div>
                  )}
                </div>
                <button type="button" className="ha-btn is-icon is-ghost" aria-label={`Remove condition ${index + 1}`} disabled={conditions.length === 1} title={conditions.length === 1 ? "A rule needs at least one condition" : undefined} onClick={() => setConditions((current) => current.filter((_, i) => i !== index))}>
                  ×
                </button>
              </div>
              <div className="ha-sub rr-hint">{meta.hint}</div>
              {error && <div className="ha-error-text" role="alert">{error}</div>}
            </div>
          );
        })}
        <button type="button" className="ha-btn is-sm mt-2" onClick={() => setConditions((current) => [...current, { ...NEW_CONDITION }])}>
          <i className="icon-carus-plus" aria-hidden="true" /> Add another condition
        </button>
      </fieldset>

      <fieldset className="ha-field rr-step">
        <legend>…send it to</legend>
        <div className="rr-channels" role="radiogroup" aria-label="Where to send the vehicle">
          {CHANNELS.map((option) => (
            <label key={option.value} className={`rr-channel${channel === option.value ? " is-selected" : ""}`}>
              <input type="radio" name={`${id}-channel`} value={option.value} checked={channel === option.value} onChange={() => setChannel(option.value)} />
              <span>
                <b>{option.label}</b>
                <span className="ha-sub">{option.text}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="rr-discount">
          {!needsDiscount && (
            <label className="ha-check">
              <input type="checkbox" checked={setDiscount} onChange={(e) => setSetDiscount(e.target.checked)} />
              Set a {channelMeta.discountLabel.toLowerCase()} automatically
            </label>
          )}
          {discountOn && (
            <div className="rr-unit">
              <label htmlFor={`${id}-discount`} className="ha-visually-hidden">{channelMeta.discountLabel} discount in percent</label>
              <span>{channelMeta.discountLabel}</span>
              <input id={`${id}-discount`} type="number" min={0} max={95} step={0.5} inputMode="decimal" className="ha-input" value={discount} onChange={(e) => setDiscountText(e.target.value)} />
              <span>% below the vehicle&apos;s valuation</span>
            </div>
          )}
          {needsDiscount && <div className="ha-hint">Required: the asking price is worked out from the valuation.</div>}
          {generalProblems.filter((p) => p.message !== "Give the rule a name.").map((p) => <div key={p.message} className="ha-error-text" role="alert">{p.message}</div>)}
        </div>
      </fieldset>

      <label className="ha-check mb-3">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Switch this rule on straight away
      </label>

      <div className="rr-reads" aria-live="polite">
        <span className="ha-eyebrow">This rule reads</span>
        <p>{describeRule({ conditions, action: draft.action })}</p>
        <span className="ha-sub">Rules are tried top to bottom — the first one that matches wins. New rules start at the bottom; you can move them afterwards.</span>
      </div>

      {serverError && <Notice tone="danger">{serverError}</Notice>}

      <div className="ha-modal-foot" style={{ padding: "12px 0 0" }}>
        <button type="button" className="ha-btn" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="submit" className="ha-btn is-primary" disabled={busy} aria-busy={busy}>
          {busy ? "Saving…" : rule ? "Save changes" : "Create rule"}
        </button>
      </div>
    </form>
  );
}
