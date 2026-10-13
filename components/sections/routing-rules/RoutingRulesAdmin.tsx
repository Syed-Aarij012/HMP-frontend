"use client";

import { Fragment, useState, type FormEvent } from "react";
import { useApplyRoutingRule, useRoutingRules } from "@/hooks/useRoutingRules";
import { ROUTING_RULE_CHANNELS, ROUTING_RULE_FIELDS, ROUTING_RULE_OPERATORS, type RoutingRuleCondition } from "@/types/routingRules";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Badge, Card, DataTable, EmptyState, ErrorNotice, LoadingRows, Notice, humanize } from "@/components/ui/kit";

type ConditionRow = { field: RoutingRuleCondition["field"]; operator: RoutingRuleCondition["operator"]; value: string };

export default function RoutingRulesAdmin() {
  const { rules, loading, error, create, creating, createError } = useRoutingRules();
  const { apply, applying, applyError, result } = useApplyRoutingRule();

  const [name, setName] = useState("");
  const [priority, setPriority] = useState("100");
  const [conditions, setConditions] = useState<ConditionRow[]>([{ field: "vehicle_age_years", operator: ">", value: "8" }]);
  const [channel, setChannel] = useState<(typeof ROUTING_RULE_CHANNELS)[number]>("auction_lot");
  const [reserveDiscountPct, setReserveDiscountPct] = useState("0.05");

  const [triggerVehicleId, setTriggerVehicleId] = useState("");

  function updateCondition(i: number, field: keyof ConditionRow, value: string) {
    setConditions((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const ok = await create(name, Number(priority), conditions, {
      channel,
      reserveDiscountPct: reserveDiscountPct === "" ? null : Number(reserveDiscountPct),
    });
    if (ok) {
      setName("");
      setConditions([{ field: "vehicle_age_years", operator: ">", value: "8" }]);
    }
  }

  async function handleTrigger(event: FormEvent) {
    event.preventDefault();
    if (!triggerVehicleId.trim()) return;
    await apply(triggerVehicleId.trim());
  }

  return (
    <DashboardPage title="Auto-routing rules" description="Rules are evaluated in priority order (lowest first); the first fully-matching active rule wins.">
      <Card className="mb-4" title="Rules">
        {loading && <LoadingRows rows={3} label="Loading rules" />}
        {error && <ErrorNotice message={error} />}
        {!loading && rules.length === 0 && <EmptyState icon="icon-carus-arrowsleftright" title="No rules defined yet" text="Create the first rule below." />}
        {rules.length > 0 && (
          <DataTable caption="Auto-routing rules, in evaluation order">
              <thead>
                <tr>
                  <th scope="col" className="is-num">Priority</th>
                  <th scope="col">Name</th>
                  <th scope="col">Conditions</th>
                  <th scope="col">Action</th>
                  <th scope="col">Active</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Priority" className="is-num">{r.priority}</td>
                    <td data-label="Name" className="ha-primary-text">{r.name}</td>
                    <td data-label="Conditions">
                      <div className="ha-chips">
                        {r.conditions.map((c, i) => (
                          <code key={i}>
                            {c.field} {c.operator} {c.value}
                          </code>
                        ))}
                      </div>
                    </td>
                    <td data-label="Action">
                      <Badge plain>{humanize(r.action.channel)}</Badge>
                      {r.action.reserveDiscountPct !== null && <div className="ha-sub">Reserve −{(r.action.reserveDiscountPct * 100).toFixed(0)}%</div>}
                    </td>
                    <td data-label="Active">
                      <Badge tone={r.isActive ? "success" : "neutral"}>{r.isActive ? "Active" : "Inactive"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
        )}
      </Card>

      <div className="ha-grid is-2" style={{ alignItems: "start" }}>
      <Card title="New rule">
      <form onSubmit={handleCreate} className="ha-card-body">
        {createError && <Notice tone="danger">{createError}</Notice>}
        <div className="ha-form-grid">
          <div className="ha-field">
            <label htmlFor="routin-name">Name</label>
            <input id="routin-name" type="text" className="ha-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="ha-field">
            <label htmlFor="routin-priority-lower-runs-first">Priority (lower runs first)</label>
            <input id="routin-priority-lower-runs-first" type="number" className="ha-input" value={priority} onChange={(e) => setPriority(e.target.value)} required />
          </div>
        </div>

        <fieldset className="ha-field">
        <legend>Conditions (all must match)</legend>
        <div className="ha-row-editor" style={{ gridTemplateColumns: "minmax(0, 1.4fr) 90px minmax(0, 1fr)" }}>
        {conditions.map((c, i) => (
          <Fragment key={i}>
              <select className="ha-select" aria-label={`Field, condition ${i + 1}`} value={c.field} onChange={(e) => updateCondition(i, "field", e.target.value)}>
                {ROUTING_RULE_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <select className="ha-select" aria-label={`Operator, condition ${i + 1}`} value={c.operator} onChange={(e) => updateCondition(i, "operator", e.target.value)}>
                {ROUTING_RULE_OPERATORS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <input type="text" className="ha-input" aria-label={`Value, condition ${i + 1}`} value={c.value} onChange={(e) => updateCondition(i, "value", e.target.value)} required />
          </Fragment>
        ))}
        </div>
        <button
          type="button"
          className="ha-btn is-sm mt-2"
          onClick={() => setConditions((prev) => [...prev, { field: "vehicle_age_years", operator: ">", value: "" }])}
        >
          <i className="icon-carus-plus" aria-hidden="true" /> Add condition
        </button>
        </fieldset>

        <fieldset className="ha-field">
        <legend>Action</legend>
        <div className="ha-form-grid">
          <div className="ha-field">
            <label htmlFor="routin-route-to">Route to</label>
            <select id="routin-route-to" className="ha-select" value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)}>
              {ROUTING_RULE_CHANNELS.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
            </select>
          </div>
          <div className="ha-field">
            <label htmlFor="routin-reserve-discount-off-valuati">Reserve discount off valuation (0-0.95, blank = none)</label>
            <input id="routin-reserve-discount-off-valuati" type="number" step="0.01" min="0" max="0.95" className="ha-input" value={reserveDiscountPct} onChange={(e) => setReserveDiscountPct(e.target.value)} />
          </div>
        </div>
        </fieldset>

        <button type="submit" className="ha-btn is-primary" disabled={creating} aria-busy={creating}>{creating ? "Creating…" : "Create rule"}</button>
      </form>
      </Card>

      <Card title="Auto-route a vehicle now" description="Runs the rules against one vehicle immediately.">
      <form onSubmit={handleTrigger} className="ha-card-body">
        {applyError && <Notice tone="danger">{applyError}</Notice>}
        {result && (
          <Notice tone="success">
            Routed to {result.routedToChannel} #{result.routedToId}
          </Notice>
        )}
        <div className="ha-actions is-start" style={{ flexWrap: "nowrap" }}>
          <input type="text" className="ha-input" placeholder="Vehicle ID" aria-label="Vehicle ID" value={triggerVehicleId} onChange={(e) => setTriggerVehicleId(e.target.value)} required />
          <button type="submit" className="ha-btn is-primary" disabled={applying} aria-busy={applying}>{applying ? "Routing…" : "Auto-route"}</button>
        </div>
      </form>
      </Card>
      </div>
    </DashboardPage>
  );
}
