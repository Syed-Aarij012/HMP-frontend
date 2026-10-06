"use client";

import { useState, type FormEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useApplyRoutingRule, useRoutingRules } from "@/hooks/useRoutingRules";
import { ROUTING_RULE_CHANNELS, ROUTING_RULE_FIELDS, ROUTING_RULE_OPERATORS, type RoutingRuleCondition } from "@/types/routingRules";

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
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">Auto-routing rules</h1>
                  <p className="text-color-2 mb-3">
                    Rules are evaluated in priority order (lowest first); the first fully-matching active rule wins.
                  </p>

                  <div className="tfcl-card p-3 mb-3">
                    <h4 className="mb-2">Active rules</h4>
                    {loading && <p>Loading...</p>}
                    {error && <div className="alert alert-danger">{error}</div>}
                    {!loading && rules.length === 0 && <p className="tfcl-empty-data">No rules defined yet.</p>}
                    {rules.length > 0 && (
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Priority</th>
                              <th>Name</th>
                              <th>Conditions</th>
                              <th>Action</th>
                              <th>Active</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rules.map((r) => (
                              <tr key={r.id}>
                                <td>{r.priority}</td>
                                <td>{r.name}</td>
                                <td>{r.conditions.map((c) => `${c.field} ${c.operator} ${c.value}`).join(" AND ")}</td>
                                <td>
                                  {r.action.channel}
                                  {r.action.reserveDiscountPct !== null ? ` (reserve -${(r.action.reserveDiscountPct * 100).toFixed(0)}%)` : ""}
                                </td>
                                <td>{r.isActive ? "Yes" : "No"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleCreate} className="tfcl-card p-3 mb-3">
                    <h4 className="mb-2">New rule</h4>
                    {createError && <div className="alert alert-danger">{createError}</div>}
                    <div className="row">
                      <div className="col-md-8 form-group">
                        <label>Name</label>
                        <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                      </div>
                      <div className="col-md-4 form-group">
                        <label>Priority (lower runs first)</label>
                        <input type="number" className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)} required />
                      </div>
                    </div>

                    <h5 className="mb-2">Conditions (all must match)</h5>
                    {conditions.map((c, i) => (
                      <div className="row" key={i}>
                        <div className="col-md-4 form-group">
                          <select className="form-control" value={c.field} onChange={(e) => updateCondition(i, "field", e.target.value)}>
                            {ROUTING_RULE_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div className="col-md-4 form-group">
                          <select className="form-control" value={c.operator} onChange={(e) => updateCondition(i, "operator", e.target.value)}>
                            {ROUTING_RULE_OPERATORS.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div className="col-md-4 form-group">
                          <input type="text" className="form-control" value={c.value} onChange={(e) => updateCondition(i, "value", e.target.value)} required />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="sc-button mb-2"
                      onClick={() => setConditions((prev) => [...prev, { field: "vehicle_age_years", operator: ">", value: "" }])}
                    >
                      <span>Add condition</span>
                    </button>

                    <h5 className="mb-2">Action</h5>
                    <div className="row">
                      <div className="col-md-6 form-group">
                        <label>Route to</label>
                        <select className="form-control" value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)}>
                          {ROUTING_RULE_CHANNELS.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
                        </select>
                      </div>
                      <div className="col-md-6 form-group">
                        <label>Reserve discount off valuation (0-0.95, blank = none)</label>
                        <input type="number" step="0.01" min="0" max="0.95" className="form-control" value={reserveDiscountPct} onChange={(e) => setReserveDiscountPct(e.target.value)} />
                      </div>
                    </div>

                    <button type="submit" className="sc-button" disabled={creating}>
                      <span>{creating ? "Creating..." : "Create rule"}</span>
                    </button>
                  </form>

                  <form onSubmit={handleTrigger} className="tfcl-card p-3">
                    <h4 className="mb-2">Auto-route a vehicle now</h4>
                    {applyError && <div className="alert alert-danger">{applyError}</div>}
                    {result && (
                      <div className="alert alert-success">
                        Routed to {result.routedToChannel} #{result.routedToId}
                      </div>
                    )}
                    <div className="flex gap-10">
                      <input type="text" className="form-control" placeholder="Vehicle ID" value={triggerVehicleId} onChange={(e) => setTriggerVehicleId(e.target.value)} required />
                      <button type="submit" className="sc-button" disabled={applying}>
                        <span>{applying ? "Routing..." : "Auto-route"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
