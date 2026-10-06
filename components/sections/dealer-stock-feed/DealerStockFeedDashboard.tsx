"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useDealerFeedMappingTemplates, useDealerStockFeedRuns } from "@/hooks/useDealerStockFeed";
import { DEALER_FEED_INTERNAL_FIELDS } from "@/types/dealerStockFeed";

type MappingRow = { csvHeader: string; internalField: string };

function MappingTemplateForm({ onCreate, creating, createError }: { onCreate: (name: string, mapping: Record<string, string>) => Promise<boolean>; creating: boolean; createError: string | null }) {
  const [name, setName] = useState("");
  const [rows, setRows] = useState<MappingRow[]>([{ csvHeader: "", internalField: DEALER_FEED_INTERNAL_FIELDS[0] }]);

  function updateRow(i: number, field: keyof MappingRow, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const mapping: Record<string, string> = {};
    rows.forEach((r) => {
      if (r.csvHeader.trim()) mapping[r.csvHeader.trim()] = r.internalField;
    });
    const ok = await onCreate(name, mapping);
    if (ok) {
      setName("");
      setRows([{ csvHeader: "", internalField: DEALER_FEED_INTERNAL_FIELDS[0] }]);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="tfcl-card p-3 mb-3">
      <h4 className="mb-2">New mapping template</h4>
      {createError && <div className="alert alert-danger">{createError}</div>}
      <div className="form-group">
        <label>Template name</label>
        <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      {rows.map((row, i) => (
        <div className="row" key={i}>
          <div className="col-md-6 form-group">
            <input type="text" className="form-control" placeholder="CSV column header" value={row.csvHeader} onChange={(e) => updateRow(i, "csvHeader", e.target.value)} required />
          </div>
          <div className="col-md-6 form-group">
            <select className="form-control" value={row.internalField} onChange={(e) => updateRow(i, "internalField", e.target.value)}>
              {DEALER_FEED_INTERNAL_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      ))}
      <button type="button" className="sc-button mb-2" onClick={() => setRows((prev) => [...prev, { csvHeader: "", internalField: DEALER_FEED_INTERNAL_FIELDS[0] }])}>
        <span>Add column</span>
      </button>
      <div>
        <button type="submit" className="sc-button" disabled={creating}>
          <span>{creating ? "Saving..." : "Save template"}</span>
        </button>
      </div>
    </form>
  );
}

export default function DealerStockFeedDashboard() {
  const { user } = useAuth();
  const { templates, loading: templatesLoading, error: templatesError, create, creating, createError } = useDealerFeedMappingTemplates();
  const { runs, loading: runsLoading, error: runsError, upload, uploading, uploadError, lastRun, syncDms, syncing, syncError } = useDealerStockFeedRuns();

  const [file, setFile] = useState<File | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [dmsDryRun, setDmsDryRun] = useState(true);

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    if (!file || !templateId) return;
    await upload(file, Number(templateId), dryRun);
  }

  if (!user?.organization_id) {
    return (
      <div id="themesflat-content">
        <DashboardToggle />
        <div className="container">
          <div className="alert alert-info mt-3">This page is for dealer accounts only.</div>
        </div>
      </div>
    );
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
                  <h1 className="admin-title mb-3">Bulk stock upload</h1>
                  <p className="text-color-2 mb-3">Upload a CSV stock export to list many vehicles at once.</p>

                  {templatesLoading && <p>Loading mapping templates...</p>}
                  {templatesError && <div className="alert alert-danger">{templatesError}</div>}

                  <MappingTemplateForm onCreate={create} creating={creating} createError={createError} />

                  <form onSubmit={handleUpload} className="tfcl-card p-3 mb-3">
                    <h4 className="mb-2">Upload CSV</h4>
                    {uploadError && <div className="alert alert-danger">{uploadError}</div>}
                    <div className="row">
                      <div className="col-md-5 form-group">
                        <label>File</label>
                        <input type="file" className="form-control" accept=".csv,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
                      </div>
                      <div className="col-md-5 form-group">
                        <label>Mapping template</label>
                        <select className="form-control" value={templateId} onChange={(e) => setTemplateId(e.target.value)} required>
                          <option value="">Choose...</option>
                          {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div className="col-md-2 form-group">
                        <label className="flex gap-10" style={{ alignItems: "center" }}>
                          <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
                          Dry run
                        </label>
                      </div>
                    </div>
                    <button type="submit" className="sc-button" disabled={uploading || templates.length === 0}>
                      <span>{uploading ? "Processing..." : "Upload"}</span>
                    </button>
                  </form>

                  <div className="tfcl-card p-3 mb-3">
                    <h4 className="mb-2">Sync from your DMS</h4>
                    <p className="text-color-2 mb-2">Pulls stock directly from your connected dealer management system.</p>
                    {syncError && <div className="alert alert-danger">{syncError}</div>}
                    <div className="flex gap-10" style={{ alignItems: "center" }}>
                      <label className="flex gap-10 mb-0" style={{ alignItems: "center" }}>
                        <input type="checkbox" checked={dmsDryRun} onChange={(e) => setDmsDryRun(e.target.checked)} />
                        Dry run
                      </label>
                      <button type="button" className="sc-button" disabled={syncing} onClick={() => syncDms(dmsDryRun)}>
                        <span>{syncing ? "Syncing..." : "Sync now"}</span>
                      </button>
                    </div>
                  </div>

                  {lastRun && (
                    <div className="tfcl-card p-3 mb-3">
                      <h4 className="mb-2">
                        {lastRun.mode === "dry_run" ? "Dry-run result" : "Import result"} — {lastRun.validRows}/{lastRun.totalRows} valid
                        {lastRun.mode === "commit" ? `, ${lastRun.report.filter((r) => r.status === "created").length} listed` : ""}
                      </h4>
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Row</th>
                              <th>Status</th>
                              <th>Vehicle</th>
                              <th>Errors</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lastRun.report.map((r) => (
                              <tr key={r.row}>
                                <td>{r.row}</td>
                                <td className="text-capitalize">{r.status}</td>
                                <td>{r.vehicleId ?? "-"}</td>
                                <td>{r.errors ? Object.values(r.errors).flat().join("; ") : "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="tfcl-card p-3">
                    <h4 className="mb-2">Run history</h4>
                    {runsLoading && <p>Loading...</p>}
                    {runsError && <div className="alert alert-danger">{runsError}</div>}
                    {!runsLoading && runs.length === 0 && <p className="tfcl-empty-data">No runs yet.</p>}
                    {runs.length > 0 && (
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Source</th>
                              <th>Mode</th>
                              <th>Valid / Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {runs.map((r) => (
                              <tr key={r.id}>
                                <td>{new Date(r.createdAt).toLocaleString()}</td>
                                <td className="text-capitalize">{r.source}</td>
                                <td className="text-capitalize">{r.mode.replace("_", " ")}</td>
                                <td>{r.validRows} / {r.totalRows}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
