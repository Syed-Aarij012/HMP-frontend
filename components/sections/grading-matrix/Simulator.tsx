"use client";

import { useId, useMemo, useState } from "react";
import { GRADE_NOTE, SEVERITIES, bandLabel, gradeFor, gradeRanges, label, type FlatEntry, type Severity } from "./model";

type Picked = { panel: string; damageType: string; severity: Severity };

/**
 * "Try it": pick some damage and watch the points add up and the grade appear — the quickest
 * way to see what a matrix and its grade bands actually do to a car.
 */
export default function Simulator({ rules, caps }: { rules: FlatEntry[]; caps: string[] }) {
  const id = useId();
  const [panel, setPanel] = useState("");
  const [damage, setDamage] = useState("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [items, setItems] = useState<Picked[]>([]);

  const panels = useMemo(() => [...new Set(rules.map((r) => r.panel))], [rules]);
  const damages = useMemo(() => [...new Set(rules.filter((r) => r.panel === panel).map((r) => r.damageType))], [rules, panel]);
  const severities = useMemo(() => rules.filter((r) => r.panel === panel && r.damageType === damage).map((r) => r.severity), [rules, panel, damage]);

  const lookup = (item: Picked) => rules.find((r) => r.panel === item.panel && r.damageType === item.damageType && r.severity === item.severity);
  const total = items.reduce((sum, item) => sum + (lookup(item)?.points ?? 0), 0);
  const grade = gradeFor(total, caps);
  const range = gradeRanges(caps).find((r) => r.grade === grade);

  if (rules.length === 0) {
    return <p className="ha-sub mb-0">Add some damage rules to try out the grading.</p>;
  }

  return (
    <div className="gm-sim">
      <div className="gm-sim-pick">
        <div className="ha-field">
          <label htmlFor={`${id}-panel`}>Panel</label>
          <select id={`${id}-panel`} className="ha-select" value={panel} onChange={(e) => { setPanel(e.target.value); setDamage(""); setSeverity(""); }}>
            <option value="">Choose a panel…</option>
            {panels.map((p) => <option key={p} value={p}>{label(p)}</option>)}
          </select>
        </div>
        <div className="ha-field">
          <label htmlFor={`${id}-damage`}>Damage</label>
          <select id={`${id}-damage`} className="ha-select" value={damage} disabled={!panel} onChange={(e) => { setDamage(e.target.value); setSeverity(""); }}>
            <option value="">{panel ? "Choose damage…" : "Pick a panel first"}</option>
            {damages.map((d) => <option key={d} value={d}>{label(d)}</option>)}
          </select>
        </div>
        <div className="ha-field">
          <label htmlFor={`${id}-sev`}>Severity</label>
          <select id={`${id}-sev`} className="ha-select" value={severity} disabled={!damage} onChange={(e) => setSeverity(e.target.value as Severity)}>
            <option value="">{damage ? "Choose severity…" : "Pick damage first"}</option>
            {SEVERITIES.filter((s) => severities.includes(s.value)).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <button
          type="button"
          className="ha-btn is-primary gm-sim-add"
          disabled={!panel || !damage || !severity}
          onClick={() => {
            setItems((current) => [...current, { panel, damageType: damage, severity: severity as Severity }]);
            setSeverity("");
          }}
        >
          Add damage
        </button>
      </div>

      <div className="gm-sim-result" aria-live="polite">
        {items.length === 0 ? (
          <p className="ha-sub mb-0">No damage added — this car would be <b>Grade 1</b> with <b>0 points</b>. Add some damage above to see it change.</p>
        ) : (
          <>
            <ul className="gm-sim-items">
              {items.map((item, index) => {
                const rule = lookup(item);
                return (
                  <li key={index}>
                    <span>
                      <b>{label(item.panel)}</b> · {label(item.damageType)} · {label(item.severity)}
                      {rule && <span className="ha-sub"> — {bandLabel(rule.band)} to repair</span>}
                    </span>
                    <span className="ha-num gm-sim-pts">+{rule?.points ?? 0}</span>
                    <button type="button" className="ha-btn is-sm is-ghost is-icon" aria-label={`Remove ${label(item.panel)} ${label(item.damageType)}`} onClick={() => setItems((current) => current.filter((_, i) => i !== index))}>
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="gm-sim-total">
              <span>
                <b className="ha-num">{total}</b> points in total
              </span>
              <span className={`gm-grade-chip is-g${grade}`}>
                Grade {grade}
                {GRADE_NOTE[grade] ? ` (${GRADE_NOTE[grade]})` : ""}
              </span>
            </div>
            {range && (
              <p className="ha-sub mb-0">
                Grade {grade} covers {range.to === null ? `${range.from}+` : `${range.from}–${range.to}`} points.
              </p>
            )}
            <button type="button" className="ha-link-btn" onClick={() => setItems([])}>
              Start again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
