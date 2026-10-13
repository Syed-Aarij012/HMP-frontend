"use client";

import { Fragment, useState, type FormEvent } from "react";
import { useGradingMatrixAdmin } from "@/hooks/useInspection";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Badge, Card, DataTable, EmptyState, ErrorNotice, LoadingRows, Notice, formatDate } from "@/components/ui/kit";

type ThresholdRow = { maxPoints: string; grade: string };
type EntryRow = { damageType: string; panel: string; severity: "minor" | "moderate" | "severe"; repairCostBand: string; points: string };

export default function GradingMatrixAdmin() {
  const { pending, loading, error, draft, drafting, draftError, approve, approvingId, approveError } = useGradingMatrixAdmin();

  const [versionLabel, setVersionLabel] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [thresholds, setThresholds] = useState<ThresholdRow[]>([{ maxPoints: "5", grade: "1" }]);
  const [entries, setEntries] = useState<EntryRow[]>([
    { damageType: "scuff", panel: "front_bumper", severity: "minor", repairCostBand: "low", points: "2" },
  ]);

  function addThreshold() {
    setThresholds((prev) => [...prev, { maxPoints: "", grade: "" }]);
  }
  function updateThreshold(index: number, field: keyof ThresholdRow, value: string) {
    setThresholds((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }
  function removeThreshold(index: number) {
    setThresholds((prev) => prev.filter((_, i) => i !== index));
  }

  function addEntry() {
    setEntries((prev) => [...prev, { damageType: "", panel: "", severity: "minor", repairCostBand: "", points: "" }]);
  }
  function updateEntry(index: number, field: keyof EntryRow, value: string) {
    setEntries((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }
  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const ok = await draft(
      versionLabel,
      new Date(effectiveFrom).toISOString(),
      thresholds.map((t) => ({ max_points: t.maxPoints === "" ? null : Number(t.maxPoints), grade: Number(t.grade) })),
      entries.map((e) => ({
        damage_type: e.damageType,
        panel: e.panel,
        severity: e.severity,
        repair_cost_band: e.repairCostBand,
        points: Number(e.points),
      })),
    );
    if (ok) {
      setVersionLabel("");
      setEffectiveFrom("");
    }
  }

  return (
    <DashboardPage title="Grading matrix" description="Draft a new version, then have a different Quality Supervisor approve it before it takes effect.">
      <Card className="mb-4" title="Pending approval" actions={pending.length > 0 ? <Badge tone="warning">{pending.length} waiting</Badge> : undefined}>
        {loading && <LoadingRows rows={2} label="Loading versions" />}
        {error && <ErrorNotice message={error} />}
        {approveError && <ErrorNotice message={approveError} />}
        {!loading && pending.length === 0 && <EmptyState icon="icon-carus-checkcircle" title="Nothing awaiting approval" />}
        {pending.length > 0 && (
          <DataTable caption="Grading matrix versions awaiting approval">
            <thead>
              <tr>
                <th scope="col">Label</th>
                <th scope="col">Effective from</th>
                <th scope="col" className="is-num">Entries</th>
                <th scope="col">
                  <span className="ha-visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pending.map((version) => (
                <tr key={version.id}>
                  <td data-label="Label" className="ha-primary-text">{version.versionLabel}</td>
                  <td data-label="Effective from">{formatDate(version.effectiveFrom, { time: true })}</td>
                  <td data-label="Entries" className="is-num">{version.entries.length}</td>
                  <td data-label="" className="ha-right">
                    <button type="button" className="ha-btn is-sm is-primary" disabled={approvingId === version.id} aria-busy={approvingId === version.id} onClick={() => approve(version.id)}>
                      {approvingId === version.id ? "Approving…" : "Approve"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>

      <Card title="Draft a new version">
        <form onSubmit={handleSubmit} className="ha-card-body">
          {draftError && <Notice tone="danger">{draftError}</Notice>}

          <div className="ha-form-grid">
            <div className="ha-field">
              <label htmlFor="gm-label">Version label</label>
              <input id="gm-label" type="text" className="ha-input" value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} required />
            </div>
            <div className="ha-field">
              <label htmlFor="gm-effective">Effective from</label>
              <input id="gm-effective" type="datetime-local" className="ha-input" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} required />
            </div>
          </div>

          <fieldset className="ha-field">
            <legend>Grade thresholds</legend>
            <div className="ha-row-editor" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) auto" }}>
              <span className="ha-row-editor-head">Max points</span>
              <span className="ha-row-editor-head">Grade (1–5)</span>
              <span className="ha-row-editor-head"><span className="ha-visually-hidden">Remove</span></span>
              {thresholds.map((row, i) => (
                <Fragment key={i}>
                  <input type="number" className="ha-input" placeholder="Blank = no cap" aria-label={`Max points, threshold ${i + 1}`} value={row.maxPoints} onChange={(e) => updateThreshold(i, "maxPoints", e.target.value)} />
                  <input type="number" min="1" max="5" className="ha-input" aria-label={`Grade, threshold ${i + 1}`} value={row.grade} onChange={(e) => updateThreshold(i, "grade", e.target.value)} required />
                  <button type="button" className="ha-btn is-icon is-ghost" aria-label={`Remove threshold ${i + 1}`} onClick={() => removeThreshold(i)}>
                    ×
                  </button>
                </Fragment>
              ))}
            </div>
            <button type="button" className="ha-btn is-sm mt-2" onClick={addThreshold}>
              <i className="icon-carus-plus" aria-hidden="true" /> Add threshold
            </button>
          </fieldset>

          <fieldset className="ha-field">
            <legend>Matrix entries</legend>
            <div className="ha-table-wrap">
              <div className="ha-row-editor" style={{ gridTemplateColumns: "minmax(120px, 1fr) minmax(120px, 1fr) 120px minmax(120px, 1fr) 90px auto", minWidth: 680 }}>
                <span className="ha-row-editor-head">Panel</span>
                <span className="ha-row-editor-head">Damage type</span>
                <span className="ha-row-editor-head">Severity</span>
                <span className="ha-row-editor-head">Repair cost band</span>
                <span className="ha-row-editor-head">Points</span>
                <span className="ha-row-editor-head"><span className="ha-visually-hidden">Remove</span></span>
                {entries.map((row, i) => (
                  <Fragment key={i}>
                    <input type="text" className="ha-input" aria-label={`Panel, entry ${i + 1}`} value={row.panel} onChange={(e) => updateEntry(i, "panel", e.target.value)} required />
                    <input type="text" className="ha-input" aria-label={`Damage type, entry ${i + 1}`} value={row.damageType} onChange={(e) => updateEntry(i, "damageType", e.target.value)} required />
                    <select className="ha-select" aria-label={`Severity, entry ${i + 1}`} value={row.severity} onChange={(e) => updateEntry(i, "severity", e.target.value)}>
                      <option value="minor">Minor</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                    <input type="text" className="ha-input" aria-label={`Repair cost band, entry ${i + 1}`} value={row.repairCostBand} onChange={(e) => updateEntry(i, "repairCostBand", e.target.value)} required />
                    <input type="number" className="ha-input" aria-label={`Points, entry ${i + 1}`} value={row.points} onChange={(e) => updateEntry(i, "points", e.target.value)} required />
                    <button type="button" className="ha-btn is-icon is-ghost" aria-label={`Remove entry ${i + 1}`} onClick={() => removeEntry(i)}>
                      ×
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
            <button type="button" className="ha-btn is-sm mt-2" onClick={addEntry}>
              <i className="icon-carus-plus" aria-hidden="true" /> Add entry
            </button>
          </fieldset>

          <button type="submit" className="ha-btn is-primary" disabled={drafting} aria-busy={drafting}>
            {drafting ? "Drafting…" : "Draft version"}
          </button>
        </form>
      </Card>
    </DashboardPage>
  );
}
