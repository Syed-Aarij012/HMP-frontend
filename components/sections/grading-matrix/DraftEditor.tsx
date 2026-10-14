"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Card, Modal, Notice } from "@/components/ui/kit";
import type { DraftPayload } from "@/hooks/useGradingMatrix";
import type { GradingMatrixVersion } from "@/types/inspection";
import GradeBands from "./GradeBands";
import RulesEditor from "./RulesEditor";
import Simulator from "./Simulator";
import {
  DEFAULT_CAPS,
  useMountedNow,
  PANEL_GROUPS,
  bandsFromThresholds,
  flatten,
  rowsFromEntries,
  starterRows,
  thresholdsFromCaps,
  validate,
  type RuleRow,
} from "./model";

const STORAGE_KEY = "hmp_gm_draft_v1";

type Saved = { label: string; effectiveFrom: string; caps: string[]; rows: RuleRow[]; copied?: boolean };

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

function loadSaved(): Saved | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

/**
 * Drafting a new matrix version in four plain steps: name it, set the grade bands, score the
 * damage, check it. Your work is kept on this device until you submit or discard it.
 */
export default function DraftEditor({ active, onSubmit, drafting, error, onSubmitted }: {
  active: GradingMatrixVersion | null;
  onSubmit: (payload: DraftPayload) => Promise<boolean>;
  drafting: boolean;
  error: string | null;
  onSubmitted: () => void;
}) {
  const now = useMountedNow();
  const [label, setLabel] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [caps, setCaps] = useState<string[]>(DEFAULT_CAPS);
  const [rows, setRows] = useState<RuleRow[]>([]);
  const [restored, setRestored] = useState(false);
  const [ready, setReady] = useState(false);
  const [showProblems, setShowProblems] = useState(false);
  const [pendingStart, setPendingStart] = useState<null | "live" | "starter">(null);

  // Restore an unfinished draft, or start with "now" as the start time.
  useEffect(() => {
    const saved = loadSaved();
    queueMicrotask(() => {
      if (saved && (saved.rows.length > 0 || saved.label)) {
        setLabel(saved.label);
        setEffectiveFrom(saved.effectiveFrom || toLocalInput(new Date()));
        setCaps(saved.caps?.length === 4 ? saved.caps : DEFAULT_CAPS);
        setRows(saved.rows ?? []);
        setRestored(!saved.copied);
      } else {
        setEffectiveFrom(toLocalInput(new Date()));
      }
      setReady(true);
    });
  }, []);

  // Keep it on this device while editing.
  useEffect(() => {
    if (!ready) return;
    try {
      if (!label && rows.length === 0) window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ label, effectiveFrom, caps, rows } satisfies Saved));
    } catch {
      // Storage unavailable — the draft just won't survive a refresh.
    }
  }, [ready, label, effectiveFrom, caps, rows]);

  const problems = useMemo(() => validate({ label, effectiveFrom, caps, rows }), [label, effectiveFrom, caps, rows]);
  const flat = useMemo(() => flatten(rows), [rows]);
  const sectionProblems = (section: string) => problems.filter((p) => p.section === section);

  function startFrom(kind: "live" | "starter" | "blank") {
    if (kind === "blank") {
      setRows([]);
      setCaps(DEFAULT_CAPS);
      return;
    }
    if (kind === "live" && active) {
      setRows(rowsFromEntries(active.entries));
      setCaps(bandsFromThresholds(active.gradeThresholds));
      setLabel((current) => current || `${active.versionLabel} (revised)`);
    } else {
      setRows(PANEL_GROUPS.flatMap((group) => starterRows(group.panels)));
      setCaps(DEFAULT_CAPS);
    }
  }

  function requestStart(kind: "live" | "starter") {
    if (rows.length > 0) setPendingStart(kind);
    else startFrom(kind);
  }

  function discard() {
    setLabel("");
    setRows([]);
    setCaps(DEFAULT_CAPS);
    setEffectiveFrom(toLocalInput(new Date()));
    setRestored(false);
    setShowProblems(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (problems.length > 0) {
      setShowProblems(true);
      document.getElementById(`gm-${problems[0].section}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const ok = await onSubmit({
      versionLabel: label.trim(),
      effectiveFrom: new Date(effectiveFrom).toISOString(),
      gradeThresholds: thresholdsFromCaps(caps),
      entries: flat.map((entry) => ({ damage_type: entry.damageType, panel: entry.panel, severity: entry.severity, repair_cost_band: entry.band, points: entry.points })),
    });
    if (ok) {
      discard();
      onSubmitted();
    }
  }

  const capError = (index: number) => {
    if (!showProblems) return null;
    const cap = caps[index]?.trim();
    if (cap === "" || !Number.isInteger(Number(cap)) || Number(cap) < 0) return "Enter a whole number.";
    if (index > 0 && Number(cap) <= Number(caps[index - 1])) return `Must be above ${caps[index - 1]}.`;
    return null;
  };

  const effectiveDate = effectiveFrom ? new Date(effectiveFrom) : null;
  const effectiveInPast = effectiveDate !== null && effectiveDate.getTime() <= now;

  const steps = [
    { id: "details", n: 1, title: "Name and start time" },
    { id: "bands", n: 2, title: "Grade bands" },
    { id: "rules", n: 3, title: "Damage points" },
    { id: "review", n: 4, title: "Check and submit" },
  ] as const;

  return (
    <form onSubmit={submit} noValidate className="gm-draft">
      <nav className="gm-stepnav" aria-label="Steps">
        <ol>
          {steps.map((step) => {
            const count = step.id === "review" ? 0 : sectionProblems(step.id).length;
            const done = step.id === "review" ? problems.length === 0 : count === 0 && (step.id !== "rules" || flat.length > 0);
            return (
              <li key={step.id}>
                <a href={`#gm-${step.id}`} className={done ? "is-done" : undefined}>
                  <span className="gm-stepnav-n" aria-hidden="true">{done ? "✓" : step.n}</span>
                  {step.title}
                  <span className="ha-visually-hidden">{done ? " (complete)" : " (needs attention)"}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </nav>

      {restored && (
        <Notice tone="info">
          We kept your unfinished draft from earlier.{" "}
          <button type="button" className="ha-link-btn" onClick={discard}>
            Start over
          </button>
        </Notice>
      )}

      <Card className="mb-4 gm-section" id="gm-details" title="1 · Name and start time" description="Give this version a name people will recognise, and say when it should start applying.">
        <div className="ha-card-body">
          <div className="gm-start">
            <b>Start from</b>
            <div className="ha-chips">
              <button type="button" className="ha-btn is-sm" disabled={!active} onClick={() => requestStart("live")} title={active ? undefined : "Nothing is live yet"}>
                Copy the live matrix{active ? ` (${active.versionLabel})` : ""}
              </button>
              <button type="button" className="ha-btn is-sm" onClick={() => requestStart("starter")}>
                A common starter set
              </button>
            </div>
            <span className="ha-sub">Copying saves retyping everything — then just change what&apos;s different.</span>
          </div>
          <div className="ha-form-grid mt-4">
            <div className="ha-field">
              <label htmlFor="gm-label">Version name</label>
              <input id="gm-label" className="ha-input" value={label} placeholder="e.g. Autumn 2026" maxLength={255} aria-invalid={showProblems && !label.trim() ? true : undefined} onChange={(e) => setLabel(e.target.value)} />
              {showProblems && !label.trim() && <div className="ha-error-text">Give this version a name.</div>}
            </div>
            <div className="ha-field">
              <label htmlFor="gm-effective">Takes effect</label>
              <input id="gm-effective" type="datetime-local" className="ha-input" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
              <div className="ha-chips mt-2">
                <button type="button" className="ha-btn is-sm is-ghost" onClick={() => setEffectiveFrom(toLocalInput(new Date()))}>As soon as it&apos;s approved</button>
                <button type="button" className="ha-btn is-sm is-ghost" onClick={() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0); setEffectiveFrom(toLocalInput(d)); }}>Tomorrow, midnight</button>
                <button type="button" className="ha-btn is-sm is-ghost" onClick={() => { const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(0, 0, 0, 0); setEffectiveFrom(toLocalInput(d)); }}>In a week</button>
              </div>
            </div>
          </div>
          {effectiveDate && (
            <p className="ha-hint">
              {effectiveInPast
                ? "That time has already passed, so once a second supervisor approves it, it applies to every inspection started from that moment."
                : `Applies to inspections started after ${effectiveDate.toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })} — and only once approved. Inspections already underway keep the version they started with.`}
            </p>
          )}
        </div>
      </Card>

      <Card className="mb-4 gm-section" id="gm-bands" title="2 · Grade bands" description="How total points turn into a Condition Grade. Set the highest total each grade covers; anything above grade 4's limit is grade 5.">
        <div className="ha-card-body">
          <GradeBands caps={caps} onChange={setCaps} errorFor={capError} />
          <p className="ha-hint">
            Example: with limits {caps.slice(0, 2).join(" and ")}, a car with {Number(caps[0]) || 0} points is grade 1 and one with {(Number(caps[0]) || 0) + 1} is grade 2.
          </p>
        </div>
      </Card>

      <Card className="mb-4 gm-section" id="gm-rules" title="3 · Damage points" description="Score each kind of damage. For every panel and damage type, set the points and the likely repair cost at each severity. Leave a severity out to stop inspectors choosing it.">
        <div className="ha-card-body">
          <RulesEditor rows={rows} onChange={setRows} />
          {showProblems && sectionProblems("rules").map((p) => (
            <div key={p.message} className="ha-error-text mt-2" role="alert">{p.message}</div>
          ))}
        </div>
      </Card>

      <Card className="mb-4 gm-section" id="gm-review" title="4 · Check and submit" description="Try some damage to see how it would grade, then submit for approval.">
        <div className="ha-card-body">
          <div className="gm-review-grid">
            <dl className="ha-dl">
              <div><dt>Version</dt><dd>{label.trim() || "—"}</dd></div>
              <div><dt>Damage rules</dt><dd className="ha-num">{flat.length}</dd></div>
              <div><dt>Panels covered</dt><dd className="ha-num">{new Set(flat.map((f) => f.panel)).size}</dd></div>
              <div><dt>Takes effect</dt><dd>{effectiveDate ? effectiveDate.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—"}</dd></div>
            </dl>
            <div>
              <h3 className="hd-card-title">Try it</h3>
              <Simulator rules={flat} caps={caps} />
            </div>
          </div>
        </div>
      </Card>

      {error && <Notice tone="danger">{error}</Notice>}

      <div className="ha-form-footer gm-footer">
        <div className="gm-footer-status" role="status">
          {problems.length === 0 ? (
            <span><b>Ready to submit.</b> A second Quality Supervisor must approve it before it takes effect.</span>
          ) : showProblems ? (
            <span className="ha-error-text"><b>{problems.length} thing{problems.length === 1 ? "" : "s"} to fix:</b> {problems.map((p) => p.message).join(" ")}</span>
          ) : (
            <span className="ha-sub">{flat.length} rules so far · saved on this device</span>
          )}
        </div>
        <button type="button" className="ha-btn is-ghost" onClick={discard} disabled={drafting || (!label && rows.length === 0)}>
          Discard draft
        </button>
        <button type="submit" className="ha-btn is-primary" disabled={drafting} aria-busy={drafting}>
          {drafting ? "Submitting…" : "Submit for approval"}
        </button>
      </div>

      <Modal
        open={pendingStart !== null}
        onClose={() => setPendingStart(null)}
        title="Replace your current rules?"
        description={`This swaps everything in the grid for ${pendingStart === "live" ? "a copy of the live matrix" : "the common starter set"}. Your name and start time stay.`}
        footer={
          <>
            <button type="button" className="ha-btn" onClick={() => setPendingStart(null)}>Keep mine</button>
            <button type="button" className="ha-btn is-primary" onClick={() => { if (pendingStart) startFrom(pendingStart); setPendingStart(null); }}>Replace</button>
          </>
        }
      />
    </form>
  );
}
