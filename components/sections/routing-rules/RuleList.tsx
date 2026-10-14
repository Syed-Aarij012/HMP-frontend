"use client";

import { useState } from "react";
import { Badge, Card, EmptyState, Modal } from "@/components/ui/kit";
import type { Outcome } from "@/hooks/useRoutingRules";
import type { VehicleRoutingRule } from "@/types/routingRules";
import { channelLabel, describeRule } from "./model";

/** The rules in the order they're tried, each readable at a glance and editable in place. */
export default function RuleList({ rules, busyId, onEdit, onNew, onToggle, onMove, onDelete }: {
  rules: VehicleRoutingRule[];
  busyId: number | "new" | "order" | null;
  onEdit: (rule: VehicleRoutingRule) => void;
  onNew: () => void;
  onToggle: (rule: VehicleRoutingRule) => Promise<Outcome>;
  onMove: (rule: VehicleRoutingRule, direction: -1 | 1) => Promise<Outcome>;
  onDelete: (rule: VehicleRoutingRule) => Promise<Outcome>;
}) {
  const [confirming, setConfirming] = useState<VehicleRoutingRule | null>(null);
  const [message, setMessage] = useState<{ tone: "danger" | "info"; text: string } | null>(null);
  const [announce, setAnnounce] = useState("");

  if (rules.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="icon-carus-arrowsleftright"
          title="No routing rules yet"
          text="Without rules, vehicles stay where they are until someone routes them by hand. Add a rule to send matching cars to auction or to a fixed price automatically."
          action={<button type="button" className="ha-btn is-primary" onClick={onNew}>Create the first rule</button>}
        />
      </Card>
    );
  }

  const active = rules.filter((r) => r.isActive).length;

  return (
    <>
      {message && (
        <div className={`ha-alert is-${message.tone}`} role={message.tone === "danger" ? "alert" : "status"}>
          <div className="ha-alert-body">{message.text}</div>
          <button type="button" className="ha-alert-close" aria-label="Dismiss message" onClick={() => setMessage(null)}>×</button>
        </div>
      )}
      <p className="ha-sub rr-order-note">
        {rules.length} rule{rules.length === 1 ? "" : "s"}, {active} switched on. Tried from the top — <b>the first matching rule wins</b>, so put your most specific rules first.
      </p>
      <div className="ha-visually-hidden" role="status" aria-live="polite">{announce}</div>

      <ol className="rr-rules">
        {rules.map((rule, index) => {
          const busy = busyId === rule.id || busyId === "order";
          return (
            <li key={rule.id} className={`ha-card rr-rule${rule.isActive ? "" : " is-off"}`}>
              <div className="rr-rule-order">
                <button
                  type="button"
                  className="ha-btn is-sm is-ghost is-icon"
                  aria-label={`Move “${rule.name}” up`}
                  disabled={index === 0 || busy}
                  onClick={async () => {
                    const outcome = await onMove(rule, -1);
                    if (outcome.ok) setAnnounce(`${rule.name} moved to position ${index}.`);
                    else setMessage({ tone: "danger", text: outcome.message });
                  }}
                >
                  ▲
                </button>
                <span className="rr-rule-n ha-num" aria-label={`Position ${index + 1}`}>{index + 1}</span>
                <button
                  type="button"
                  className="ha-btn is-sm is-ghost is-icon"
                  aria-label={`Move “${rule.name}” down`}
                  disabled={index === rules.length - 1 || busy}
                  onClick={async () => {
                    const outcome = await onMove(rule, 1);
                    if (outcome.ok) setAnnounce(`${rule.name} moved to position ${index + 2}.`);
                    else setMessage({ tone: "danger", text: outcome.message });
                  }}
                >
                  ▼
                </button>
              </div>

              <div className="rr-rule-main">
                <div className="rr-rule-title">
                  <b>{rule.name}</b>
                  <Badge tone={rule.isActive ? "success" : "neutral"}>{rule.isActive ? "On" : "Off"}</Badge>
                  <Badge plain tone="primary">{channelLabel(rule.action.channel)}</Badge>
                </div>
                <p className="rr-rule-sentence">{describeRule(rule)}</p>
                <span className="ha-sub">
                  {rule.applicationsCount > 0 ? `Has routed ${rule.applicationsCount} vehicle${rule.applicationsCount === 1 ? "" : "s"}` : "Hasn't routed any vehicles yet"}
                  {!rule.isActive && " · skipped while it's off"}
                </span>
              </div>

              <div className="rr-rule-actions">
                <button
                  type="button"
                  role="switch"
                  aria-checked={rule.isActive}
                  aria-label={`${rule.name} is ${rule.isActive ? "on" : "off"}`}
                  className={`ha-switch${rule.isActive ? " is-on" : ""}`}
                  disabled={busy}
                  onClick={async () => {
                    const outcome = await onToggle(rule);
                    if (!outcome.ok) setMessage({ tone: "danger", text: outcome.message });
                  }}
                />
                <button type="button" className="ha-btn is-sm" onClick={() => onEdit(rule)} disabled={busy}>Edit</button>
                <button
                  type="button"
                  className="ha-btn is-sm is-ghost is-danger"
                  disabled={busy}
                  onClick={() => (rule.applicationsCount > 0 ? setMessage({ tone: "info", text: `“${rule.name}” has already routed vehicles, so it's kept for the record. Switch it off instead.` }) : setConfirming(rule))}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <Modal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={`Delete “${confirming?.name ?? ""}”?`}
        description="It has never routed a vehicle, so nothing else is affected. This can't be undone."
        footer={
          <>
            <button type="button" className="ha-btn" onClick={() => setConfirming(null)}>Keep it</button>
            <button
              type="button"
              className="ha-btn is-danger-solid"
              onClick={async () => {
                if (!confirming) return;
                const outcome = await onDelete(confirming);
                setConfirming(null);
                if (!outcome.ok) setMessage({ tone: "danger", text: outcome.message });
              }}
            >
              Delete rule
            </button>
          </>
        }
      />
    </>
  );
}
