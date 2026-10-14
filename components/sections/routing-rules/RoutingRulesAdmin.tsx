"use client";

import { useEffect, useState } from "react";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Card, ErrorNotice, LoadingRows, Modal, Notice, Tabs } from "@/components/ui/kit";
import { useRoutingRules, type RuleDraft } from "@/hooks/useRoutingRules";
import type { VehicleRoutingRule } from "@/types/routingRules";
import RecentActivity from "./RecentActivity";
import RuleForm from "./RuleForm";
import RuleList from "./RuleList";
import TestVehicle from "./TestVehicle";

type View = "rules" | "test" | "activity";
const VIEWS: readonly View[] = ["rules", "test", "activity"];
const HELP_KEY = "hmp_rr_help_closed";

const STEPS = [
  { n: 1, title: "A rule says when…", text: "Pick conditions on a vehicle — its age, condition grade, mileage or where it came from. It must match all of them. Want “this or that”? Make two rules." },
  { n: 2, title: "…and where it goes", text: "Send it to the next scheduled auction, or list it at a fixed price for the trade, with a reserve or asking price set below its valuation." },
  { n: 3, title: "The first match wins", text: "Rules are tried from the top. Put your most specific rules first, and switch a rule off to pause it without losing it." },
];

/**
 * FR-A-032: auto-routing rules — decide where a vehicle goes next. Rules run by themselves every
 * day over part-exchange cars that have a published condition report, and can be run by hand.
 */
export default function RoutingRulesAdmin() {
  const workspace = useRoutingRules();
  const { rules, loading, error, busyId } = workspace;
  const [view, setView] = useState<View>("rules");
  const [editing, setEditing] = useState<VehicleRoutingRule | "new" | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(true);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(HELP_KEY) === "1") queueMicrotask(() => setHelpOpen(false));
    } catch {
      // Storage unavailable — stay open.
    }
  }, []);

  function toggleHelp() {
    const next = !helpOpen;
    setHelpOpen(next);
    try {
      window.localStorage.setItem(HELP_KEY, next ? "0" : "1");
    } catch {
      // A per-viewer convenience only.
    }
  }

  async function save(draft: RuleDraft) {
    const outcome = editing !== null && editing !== "new" ? await workspace.update(editing.id, draft) : await workspace.create(draft);
    if (outcome.ok) {
      setSaved(editing === "new" ? `“${draft.name.trim()}” created. It's at the bottom of the list — move it up if it should be tried earlier.` : `“${draft.name.trim()}” saved.`);
      setEditing(null);
    }
    return outcome;
  }

  async function move(rule: VehicleRoutingRule, direction: -1 | 1) {
    const ids = rules.map((r) => r.id);
    const from = ids.indexOf(rule.id);
    const to = from + direction;
    if (to < 0 || to >= ids.length) return { ok: true as const };
    [ids[from], ids[to]] = [ids[to], ids[from]];
    return workspace.reorder(ids);
  }

  return (
    <DashboardPage
      title="Auto-routing rules"
      description="Decide where a vehicle goes next. Matching cars are sent to auction or to a fixed price automatically — every day for part-exchange cars, or on demand."
      actions={
        <button type="button" className="ha-btn is-primary" onClick={() => { setSaved(null); setEditing("new"); }}>
          + New rule
        </button>
      }
    >
      <section className="ha-card gm-help" aria-label="How auto-routing works">
        <div className="gm-help-head">
          <h2>How auto-routing works</h2>
          <button type="button" className="ha-btn is-sm is-ghost" aria-expanded={helpOpen} onClick={toggleHelp}>
            {helpOpen ? "Hide" : "Show"}
          </button>
        </div>
        {helpOpen && (
          <div className="gm-help-body">
            <ol className="gm-steps">
              {STEPS.map((step) => (
                <li key={step.n}>
                  <span className="gm-step-n" aria-hidden="true">{step.n}</span>
                  <div>
                    <b>{step.title}</b>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {saved && <Notice tone="success" onDismiss={() => setSaved(null)}>{saved}</Notice>}

      <div className="gm-tabs">
        <Tabs
          label="Auto-routing"
          value={view}
          options={VIEWS}
          onChange={setView}
          labels={{ rules: `Rules${rules.length ? ` (${rules.length})` : ""}`, test: "Test a vehicle", activity: "Recent activity" }}
        />
      </div>

      {view === "rules" && (
        <>
          {loading && <Card><LoadingRows rows={4} label="Loading rules" /></Card>}
          {error && !loading && <ErrorNotice message={error} />}
          {!loading && !error && (
            <RuleList
              rules={rules}
              busyId={busyId}
              onEdit={(rule) => { setSaved(null); setEditing(rule); }}
              onNew={() => { setSaved(null); setEditing("new"); }}
              onToggle={(rule) => workspace.setActive(rule.id, !rule.isActive)}
              onMove={move}
              onDelete={(rule) => workspace.remove(rule.id)}
            />
          )}
        </>
      )}
      {view === "test" && <TestVehicle />}
      {view === "activity" && <RecentActivity />}

      <Modal
        open={editing !== null}
        wide
        onClose={() => busyId === null && setEditing(null)}
        title={editing === "new" ? "New routing rule" : "Edit routing rule"}
        description="Say when a vehicle matches and where it should go. The rule reads back as a sentence at the bottom."
      >
        {editing !== null && <RuleForm rule={editing === "new" ? null : editing} busy={busyId !== null} onSave={save} onCancel={() => setEditing(null)} />}
      </Modal>
    </DashboardPage>
  );
}
