"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDealerFeedMappingTemplates, useDealerStockFeedRuns } from "@/hooks/useDealerStockFeed";
import { DEALER_FEED_INTERNAL_FIELDS } from "@/types/dealerStockFeed";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Badge, Card, DataTable, EmptyState, ErrorNotice, LoadingRows, LoadingTable, Notice, StatusBadge, formatDate } from "@/components/ui/kit";

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
    <Card title="1. Map your CSV columns" description="Tell us which column in your export holds each vehicle field. You only need to do this once per export format.">
      <form onSubmit={handleSubmit} className="ha-card-body">
        {createError && <Notice tone="danger">{createError}</Notice>}
        <div className="ha-field" style={{ maxWidth: 360 }}>
          <label htmlFor="feed-template-name">Template name</label>
          <input id="feed-template-name" type="text" className="ha-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="ha-mapping" role="group" aria-label="Column mapping">
          <div className="ha-mapping-head" aria-hidden="true">
            <span>CSV column header</span>
            <span>HMP field</span>
          </div>
          {rows.map((row, i) => (
            <div className="ha-mapping-row" key={i}>
              <input
                type="text"
                className="ha-input"
                placeholder="e.g. Registration"
                aria-label={`CSV column header, row ${i + 1}`}
                value={row.csvHeader}
                onChange={(e) => updateRow(i, "csvHeader", e.target.value)}
                required
              />
              <span className="ha-mapping-arrow" aria-hidden="true">→</span>
              <select className="ha-select" aria-label={`HMP field, row ${i + 1}`} value={row.internalField} onChange={(e) => updateRow(i, "internalField", e.target.value)}>
                {DEALER_FEED_INTERNAL_FIELDS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="ha-actions is-start mt-3">
          <button type="button" className="ha-btn" onClick={() => setRows((prev) => [...prev, { csvHeader: "", internalField: DEALER_FEED_INTERNAL_FIELDS[0] }])}>
            <i className="icon-carus-plus" aria-hidden="true" />
            Add column
          </button>
          <button type="submit" className="ha-btn is-primary" disabled={creating} aria-busy={creating}>
            {creating ? "Saving…" : "Save template"}
          </button>
        </div>
      </form>
    </Card>
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
      <DashboardPage title="Bulk stock upload">
        <Card>
          <EmptyState icon="icon-carus-upload" title="Dealer accounts only" text="This page is for dealer accounts only." />
        </Card>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title="Bulk stock upload" description="Upload a CSV stock export, or sync from your DMS, to list many vehicles at once. Try a dry run first — nothing is listed until you commit.">
      {templatesLoading && <LoadingRows rows={2} label="Loading mapping templates" />}
      {templatesError && <Notice tone="danger">{templatesError}</Notice>}

      <div className="ha-stack mb-4">
        <MappingTemplateForm onCreate={create} creating={creating} createError={createError} />

        <div className="ha-grid is-2" style={{ alignItems: "start", marginTop: 16 }}>
          <Card title="2. Upload CSV">
            <form onSubmit={handleUpload} className="ha-card-body">
              {uploadError && <Notice tone="danger">{uploadError}</Notice>}
              <div className="ha-field">
                <label htmlFor="feed-file">File</label>
                <input id="feed-file" type="file" className="ha-input" style={{ paddingTop: 6 }} accept=".csv,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
              </div>
              <div className="ha-field">
                <label htmlFor="feed-template">Mapping template</label>
                <select id="feed-template" className="ha-select" value={templateId} onChange={(e) => setTemplateId(e.target.value)} required>
                  <option value="">Choose…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {templates.length === 0 && <div className="ha-hint">Save a mapping template first.</div>}
              </div>
              <label className="ha-check mb-3">
                <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
                Dry run (check the file without listing anything)
              </label>
              <button type="submit" className="ha-btn is-primary" disabled={uploading || templates.length === 0} aria-busy={uploading}>
                {uploading ? "Processing…" : dryRun ? "Check file" : "Upload and list"}
              </button>
            </form>
          </Card>

          <Card title="Or sync from your DMS" description="Pulls stock directly from your connected dealer management system.">
            <div className="ha-card-body">
              {syncError && <Notice tone="danger">{syncError}</Notice>}
              <label className="ha-check mb-3">
                <input type="checkbox" checked={dmsDryRun} onChange={(e) => setDmsDryRun(e.target.checked)} />
                Dry run
              </label>
              <button type="button" className="ha-btn" disabled={syncing} aria-busy={syncing} onClick={() => syncDms(dmsDryRun)}>
                {syncing ? "Syncing…" : "Sync now"}
              </button>
            </div>
          </Card>
        </div>
      </div>

      {lastRun && (
        <Card
          className="mb-4"
          title={lastRun.mode === "dry_run" ? "Dry-run result" : "Import result"}
          actions={
            <div className="ha-chips">
              <Badge tone={lastRun.validRows === lastRun.totalRows ? "success" : "warning"}>
                {lastRun.validRows}/{lastRun.totalRows} valid
              </Badge>
              {lastRun.mode === "commit" && <Badge tone="primary">{lastRun.report.filter((r) => r.status === "created").length} listed</Badge>}
            </div>
          }
        >
          <DataTable caption="Result for each row of the file">
            <thead>
              <tr>
                <th scope="col">Row</th>
                <th scope="col">Status</th>
                <th scope="col">Vehicle</th>
                <th scope="col">Errors</th>
              </tr>
            </thead>
            <tbody>
              {lastRun.report.map((r) => (
                <tr key={r.row}>
                  <td data-label="Row" className="ha-num">{r.row}</td>
                  <td data-label="Status">
                    <StatusBadge status={r.status} tone={r.errors ? "danger" : undefined} />
                  </td>
                  <td data-label="Vehicle">{r.vehicleId ?? "—"}</td>
                  <td data-label="Errors">{r.errors ? <span className="ha-inline-error">{Object.values(r.errors).flat().join("; ")}</span> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>
      )}

      <Card title="Run history">
        {runsLoading && <LoadingTable label="Loading run history" columns={4} rows={3} />}
        {runsError && <ErrorNotice message={runsError} />}
        {!runsLoading && runs.length === 0 && <EmptyState icon="icon-carus-upload" title="No runs yet" text="Each upload or DMS sync is recorded here." />}
        {runs.length > 0 && (
          <DataTable caption="Upload and sync history">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Source</th>
                <th scope="col">Mode</th>
                <th scope="col" className="is-num">Valid / total</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td data-label="Date" className="ha-num">{formatDate(r.createdAt, { time: true })}</td>
                  <td data-label="Source" className="text-capitalize">{r.source}</td>
                  <td data-label="Mode">
                    <Badge tone={r.mode === "commit" ? "primary" : "neutral"} plain>
                      {r.mode.replace("_", " ")}
                    </Badge>
                  </td>
                  <td data-label="Valid / total" className="is-num">
                    {r.validRows} / {r.totalRows}
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>
    </DashboardPage>
  );
}
