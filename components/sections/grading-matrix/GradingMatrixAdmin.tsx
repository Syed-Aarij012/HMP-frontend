"use client";

import { useState, type FormEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useGradingMatrixAdmin } from "@/hooks/useInspection";

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
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">Grading matrix</h1>
                  <p className="text-color-1 mb-3">
                    Draft a new version, then have a different Quality Supervisor approve it before it takes effect.
                  </p>

                  <div className="tfcl-card p-3 mb-3">
                    <h4 className="mb-2">Pending approval</h4>
                    {loading && <p>Loading...</p>}
                    {error && <div className="alert alert-danger">{error}</div>}
                    {approveError && <div className="alert alert-danger">{approveError}</div>}
                    {!loading && pending.length === 0 && <p className="tfcl-empty-data">Nothing awaiting approval.</p>}
                    {pending.length > 0 && (
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Label</th>
                              <th>Effective from</th>
                              <th>Entries</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {pending.map((version) => (
                              <tr key={version.id}>
                                <td>{version.versionLabel}</td>
                                <td>{new Date(version.effectiveFrom).toLocaleString()}</td>
                                <td>{version.entries.length}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="sc-button"
                                    disabled={approvingId === version.id}
                                    onClick={() => approve(version.id)}
                                  >
                                    <span>{approvingId === version.id ? "Approving..." : "Approve"}</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="tfcl-card p-3">
                    <h4 className="mb-2">Draft a new version</h4>
                    {draftError && <div className="alert alert-danger">{draftError}</div>}

                    <div className="row">
                      <div className="col-md-6 form-group">
                        <label>Version label</label>
                        <input type="text" className="form-control" value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} required />
                      </div>
                      <div className="col-md-6 form-group">
                        <label>Effective from</label>
                        <input type="datetime-local" className="form-control" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} required />
                      </div>
                    </div>

                    <h5 className="mb-2 mt-2">Grade thresholds</h5>
                    {thresholds.map((row, i) => (
                      <div className="row" key={i}>
                        <div className="col-md-4 form-group">
                          <input type="number" className="form-control" placeholder="Max points (blank = no cap)" value={row.maxPoints} onChange={(e) => updateThreshold(i, "maxPoints", e.target.value)} />
                        </div>
                        <div className="col-md-4 form-group">
                          <input type="number" min="1" max="5" className="form-control" placeholder="Grade (1-5)" value={row.grade} onChange={(e) => updateThreshold(i, "grade", e.target.value)} required />
                        </div>
                        <div className="col-md-4 form-group">
                          <button type="button" className="sc-button" onClick={() => removeThreshold(i)}><span>Remove</span></button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="sc-button mb-2" onClick={addThreshold}><span>Add threshold</span></button>

                    <h5 className="mb-2 mt-2">Matrix entries</h5>
                    {entries.map((row, i) => (
                      <div className="row" key={i}>
                        <div className="col-md-2 form-group">
                          <input type="text" className="form-control" placeholder="Panel" value={row.panel} onChange={(e) => updateEntry(i, "panel", e.target.value)} required />
                        </div>
                        <div className="col-md-2 form-group">
                          <input type="text" className="form-control" placeholder="Damage type" value={row.damageType} onChange={(e) => updateEntry(i, "damageType", e.target.value)} required />
                        </div>
                        <div className="col-md-2 form-group">
                          <select className="form-control" value={row.severity} onChange={(e) => updateEntry(i, "severity", e.target.value)}>
                            <option value="minor">Minor</option>
                            <option value="moderate">Moderate</option>
                            <option value="severe">Severe</option>
                          </select>
                        </div>
                        <div className="col-md-2 form-group">
                          <input type="text" className="form-control" placeholder="Repair cost band" value={row.repairCostBand} onChange={(e) => updateEntry(i, "repairCostBand", e.target.value)} required />
                        </div>
                        <div className="col-md-2 form-group">
                          <input type="number" className="form-control" placeholder="Points" value={row.points} onChange={(e) => updateEntry(i, "points", e.target.value)} required />
                        </div>
                        <div className="col-md-2 form-group">
                          <button type="button" className="sc-button" onClick={() => removeEntry(i)}><span>Remove</span></button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="sc-button mb-3" onClick={addEntry}><span>Add entry</span></button>

                    <div>
                      <button type="submit" className="sc-button" disabled={drafting}>
                        <span>{drafting ? "Drafting..." : "Draft version"}</span>
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
