"use client";

import { useState, type FormEvent } from "react";
import { flattenTree, useTaxonomyTree, useTaxonomyVersions } from "@/hooks/useTaxonomyAdmin";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Badge, Card, DataTable, EmptyState, ErrorNotice, LoadingRows, LoadingTable, Notice, formatDate } from "@/components/ui/kit";

export default function TaxonomyAdmin() {
  const { versions, loading, error, draft, drafting, draftError, publish, publishingId, publishError } = useTaxonomyVersions();

  const [versionLabel, setVersionLabel] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);

  const { tree, loading: treeLoading, addNode, adding, addError } = useTaxonomyTree(selectedVersionId);

  const [nodeType, setNodeType] = useState<"make" | "model" | "derivative">("make");
  const [nodeName, setNodeName] = useState("");
  const [parentId, setParentId] = useState("");

  const flatNodes = flattenTree(tree);
  const possibleParents = nodeType === "model" ? flatNodes.filter((n) => n.type === "make") : nodeType === "derivative" ? flatNodes.filter((n) => n.type === "model") : [];

  async function handleDraft(event: FormEvent) {
    event.preventDefault();
    const id = await draft(versionLabel, new Date(effectiveFrom).toISOString());
    if (id) {
      setVersionLabel("");
      setEffectiveFrom("");
      setSelectedVersionId(id);
    }
  }

  async function handleAddNode(event: FormEvent) {
    event.preventDefault();
    const ok = await addNode(nodeType, nodeName, parentId ? Number(parentId) : null);
    if (ok) setNodeName("");
  }

  const selectedVersion = versions.find((v) => v.id === selectedVersionId);

  return (
    <DashboardPage title="Vehicle taxonomy" description="Draft a make/model/derivative tree, then publish it.">
      <Card className="mb-4" title="Versions">
        {loading && <LoadingRows rows={2} label="Loading versions" />}
        {error && <ErrorNotice message={error} />}
        {publishError && <ErrorNotice message={publishError} />}
        {!loading && versions.length === 0 && <EmptyState icon="icon-carus-list" title="No taxonomy versions yet" text="Draft one below." />}
        {versions.length > 0 && (
          <DataTable caption="Taxonomy versions">
              <thead>
                <tr>
                  <th scope="col">Label</th>
                  <th scope="col">Effective from</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="ha-visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id}>
                    <td data-label="Label" className="ha-primary-text">
                      {v.versionLabel} {selectedVersionId === v.id && <Badge tone="primary" plain>Open</Badge>}
                    </td>
                    <td data-label="Effective from">{formatDate(v.effectiveFrom, { time: true })}</td>
                    <td data-label="Status">
                      <Badge tone={v.publishedAt ? "success" : "warning"}>{v.publishedAt ? "Published" : "Draft"}</Badge>
                    </td>
                    <td data-label="">
                      <div className="ha-row-actions">
                        {!v.publishedAt && (
                          <button type="button" className="ha-btn is-sm is-primary" disabled={publishingId === v.id} aria-busy={publishingId === v.id} onClick={() => publish(v.id)}>
                            {publishingId === v.id ? "Publishing…" : "Publish"}
                          </button>
                        )}
                        <button type="button" className="ha-btn is-sm" aria-pressed={selectedVersionId === v.id} onClick={() => setSelectedVersionId(v.id)}>
                          {v.publishedAt ? "View tree" : "Edit tree"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
        )}
        <form onSubmit={handleDraft} className="ha-toolbar" style={{ borderTop: "1px solid var(--hmp-border)", borderBottom: 0, alignItems: "flex-end" }} aria-label="Draft a new version">
        <div className="ha-field">
          <label htmlFor="taxono-version-label">Version label</label>
          <input id="taxono-version-label" type="text" className="ha-input" value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} required />
        </div>
        <div className="ha-field">
          <label htmlFor="taxono-effective-from">Effective from</label>
          <input id="taxono-effective-from" type="datetime-local" className="ha-input" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} required />
        </div>
        <button type="submit" className="ha-btn is-primary mb-3" disabled={drafting} aria-busy={drafting}>{drafting ? "Drafting…" : "Draft new version"}</button>
        </form>
        {draftError && (
          <div className="ha-card-body" style={{ paddingTop: 0 }}>
            <Notice tone="danger">{draftError}</Notice>
          </div>
        )}
      </Card>

      {selectedVersion && (
        <Card title={`Tree — ${selectedVersion.versionLabel}`} actions={selectedVersion.publishedAt ? <Badge>Read-only</Badge> : undefined}>
          <div className="ha-card-body">

          {treeLoading && <LoadingTable label="Loading tree" />}
          {!treeLoading && tree.length === 0 && <EmptyState icon="icon-carus-list" title="No nodes yet" text="Add a make to start." />}

          {tree.length > 0 && (
            <ul className="ha-tree mb-4">
              {flatNodes.map((n) => (
                <li key={n.id} className={`is-${n.type}`}>
                  {n.label} <Badge plain>{n.type}</Badge>
                </li>
              ))}
            </ul>
          )}

          {!selectedVersion.publishedAt && (
            <form onSubmit={handleAddNode} className="ha-actions is-start" style={{ alignItems: "flex-end" }} aria-label="Add a node">
              <div className="ha-field">
                <label htmlFor="taxono-type">Type</label>
                <select id="taxono-type" className="ha-select" value={nodeType} onChange={(e) => { setNodeType(e.target.value as typeof nodeType); setParentId(""); }}>
                  <option value="make">Make</option>
                  <option value="model">Model</option>
                  <option value="derivative">Derivative</option>
                </select>
              </div>
              {nodeType !== "make" && (
                <div className="ha-field">
                  <label htmlFor="taxono-parent">Parent</label>
                  <select id="taxono-parent" className="ha-select" value={parentId} onChange={(e) => setParentId(e.target.value)} required>
                    <option value="">Choose…</option>
                    {possibleParents.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
              )}
              <div className="ha-field">
                <label htmlFor="taxono-name">Name</label>
                <input id="taxono-name" type="text" className="ha-input" value={nodeName} onChange={(e) => setNodeName(e.target.value)} required />
              </div>
              <button type="submit" className="ha-btn is-primary" disabled={adding}>{adding ? "Adding…" : "Add node"}</button>
            </form>
          )}
          {addError && <Notice tone="danger">{addError}</Notice>}
          {selectedVersion.publishedAt && <p className="ha-sub mt-2 mb-0">This version is published and read-only.</p>}
          </div>
        </Card>
      )}
    </DashboardPage>
  );
}
