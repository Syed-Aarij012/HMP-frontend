"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Card, EmptyState, ErrorNotice, LoadingRows, Modal, Notice } from "@/components/ui/kit";
import VehiclePicker, { type PickedVehicle } from "@/components/ui/VehiclePicker";
import { useRoutingTest } from "@/hooks/useRoutingRules";
import type { RulePreview } from "@/types/routingRules";
import { channelLabel, describeAction, describeCondition, fieldLabel, sourceLabel } from "./model";

const FACT_FIELDS = ["vehicle_age_years", "condition_grade", "acquisition_source", "current_mileage"] as const;

function factText(field: string, value: string | number | null): string {
  if (value === null || value === undefined) return "Not known";
  if (field === "vehicle_age_years") return `${value} year${value === 1 ? "" : "s"}`;
  if (field === "current_mileage") return `${Number(value).toLocaleString("en-GB")} miles`;
  if (field === "acquisition_source") return sourceLabel(String(value));
  return String(value);
}

function Verdict({ rule }: { rule: RulePreview }) {
  if (!rule.isActive) return <Badge plain>Switched off</Badge>;
  if (rule.wins) return <Badge tone="success">Would apply</Badge>;
  if (rule.matched) return <Badge tone="warning">Matches, but a higher rule wins</Badge>;
  return <Badge plain>Doesn&apos;t match</Badge>;
}

/** Pick a vehicle, see which rule would pick it and why — then route it for real if you want. */
export default function TestVehicle() {
  const [vehicle, setVehicle] = useState<PickedVehicle | null>(null);
  const test = useRoutingTest(vehicle?.id ?? null);
  const [confirming, setConfirming] = useState(false);
  const { preview } = test;
  const winner = preview?.rules.find((r) => r.wins) ?? null;
  const canRoute = winner !== null && (preview?.blockers.length ?? 0) === 0 && !test.routed;

  return (
    <div className="ha-stack">
      <Card title="Test a vehicle" description="Find a car by registration or make and model to see which rule would pick it, and why. Nothing happens until you choose to route it.">
        <div className="ha-card-body">
          <VehiclePicker value={vehicle} onChange={setVehicle} endpoint="/vehicle-routing-rules/vehicles" label="Vehicle to check" showAssignments={false} />
        </div>
      </Card>

      {!vehicle && (
        <Card>
          <EmptyState icon="icon-carus-search" title="Choose a vehicle above" text="You'll see its details, each rule checked against them, and what would happen." />
        </Card>
      )}

      {vehicle && test.loading && <Card><LoadingRows rows={4} label="Checking the rules" /></Card>}
      {vehicle && test.error && <ErrorNotice message={test.error} />}

      {preview && (
        <>
          <Card title={preview.vehicle.title || "Vehicle"} description={preview.vehicle.vrm ? `Registration ${preview.vehicle.vrm}` : undefined}>
            <div className="ha-card-body">
              <dl className="ha-dl">
                {FACT_FIELDS.map((field) => (
                  <div key={field}>
                    <dt>{fieldLabel(field)}</dt>
                    <dd>{factText(field, preview.facts[field] ?? null)}</dd>
                  </div>
                ))}
                <div>
                  <dt>Sales channel now</dt>
                  <dd>{preview.vehicle.currentChannel === "none" ? "Not listed anywhere" : preview.vehicle.currentChannel}</dd>
                </div>
              </dl>
            </div>
          </Card>

          {winner ? (
            <Notice tone={preview.blockers.length > 0 ? "warning" : "success"}>
              <b>“{winner.name}”</b> would {describeAction(winner.action)}.
              {preview.blockers.length > 0 && " But it can't be routed yet — see below."}
            </Notice>
          ) : (
            <Notice tone="info">No active rule matches this vehicle, so it would stay where it is.</Notice>
          )}

          {preview.blockers.length > 0 && (
            <Notice tone="warning">
              <b>Can&apos;t be routed yet:</b>
              <ul className="mb-0 mt-1">
                {preview.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
              </ul>
            </Notice>
          )}

          {test.routed && (
            <Notice tone="success">
              Routed{test.routed.rule ? ` by “${test.routed.rule}”` : ""} to <b>{channelLabel(test.routed.channel)}</b>.{" "}
              <Link href={test.routed.channel === "fixed_price" ? "/trade-marketplace" : "/auction"}>{test.routed.channel === "fixed_price" ? "See it in the trade marketplace" : "See it in the auction catalogue"} →</Link>
            </Notice>
          )}
          {test.routeError && <Notice tone="danger">{test.routeError}</Notice>}

          <Card
            title="Rule by rule"
            description="In the order they're tried."
            actions={
              <button type="button" className="ha-btn is-primary" disabled={!canRoute || test.routing} aria-busy={test.routing} onClick={() => setConfirming(true)} title={canRoute ? undefined : "Needs a matching rule and no blockers"}>
                Route this vehicle now…
              </button>
            }
          >
            {preview.rules.length === 0 ? (
              <EmptyState icon="icon-carus-arrowsleftright" title="No rules to check" text="Create a rule first." />
            ) : (
              <ol className="rr-checks">
                {preview.rules.map((rule, index) => (
                  <li key={rule.id} className={`rr-check${rule.wins ? " is-winner" : ""}${rule.isActive ? "" : " is-off"}`}>
                    <div className="rr-check-head">
                      <span className="rr-rule-n ha-num" aria-hidden="true">{index + 1}</span>
                      <b>{rule.name}</b>
                      <Verdict rule={rule} />
                    </div>
                    <ul className="rr-conds">
                      {rule.conditions.map((condition, i) => (
                        <li key={i}>
                          <span className={`rr-tick ${condition.passed ? "is-yes" : "is-no"}`} aria-hidden="true">{condition.passed ? "✓" : "✗"}</span>
                          <span>
                            <span className="ha-visually-hidden">{condition.passed ? "Matches: " : "Doesn't match: "}</span>
                            {describeCondition(condition)}
                            <span className="ha-sub"> — {condition.actual === null ? "not known for this vehicle" : `this one is ${factText(condition.field, condition.actual)}`}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </>
      )}

      <Modal
        open={confirming}
        onClose={() => !test.routing && setConfirming(false)}
        title="Route this vehicle now?"
        description={winner ? `“${winner.name}” will ${describeAction(winner.action)}. This is real: it creates ${winner.action.channel === "fixed_price" ? "a fixed-price listing" : "an auction lot"} for ${preview?.vehicle.title ?? "the vehicle"}.` : undefined}
        footer={
          <>
            <button type="button" className="ha-btn" onClick={() => setConfirming(false)} disabled={test.routing}>Not yet</button>
            <button
              type="button"
              className="ha-btn is-primary"
              disabled={test.routing}
              aria-busy={test.routing}
              onClick={async () => {
                await test.route();
                setConfirming(false);
              }}
            >
              {test.routing ? "Routing…" : "Route it"}
            </button>
          </>
        }
      />
    </div>
  );
}
