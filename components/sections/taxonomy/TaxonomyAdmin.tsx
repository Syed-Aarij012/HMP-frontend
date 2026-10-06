"use client";

import { useState, type FormEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { flattenTree, useTaxonomyTree, useTaxonomyVersions } from "@/hooks/useTaxonomyAdmin";

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
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">Vehicle taxonomy</h1>
                  <p className="text-color-2 mb-3">Draft a make/model/derivative tree, then publish it.</p>

                  <div className="tfcl-card p-3 mb-3">
                    <h4 className="mb-2">Versions</h4>
                    {loading && <p>Loading...</p>}
                    {error && <div className="alert alert-danger">{error}</div>}
                    {publishError && <div className="alert alert-danger">{publishError}</div>}
                    {!loading && versions.length === 0 && <p className="tfcl-empty-data">No taxonomy versions yet.</p>}
                    {versions.length > 0 && (
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Label</th>
                              <th>Effective from</th>
                              <th>Status</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {versions.map((v) => (
                              <tr key={v.id}>
                                <td>{v.versionLabel}</td>
                                <td>{new Date(v.effectiveFrom).toLocaleString()}</td>
                                <td>{v.publishedAt ? "Published" : "Draft"}</td>
                                <td className="flex gap-10">
                                  <button type="button" className="sc-button" onClick={() => setSelectedVersionId(v.id)}>
                                    <span>Edit tree</span>
                                  </button>
                                  {!v.publishedAt && (
                                    <button type="button" className="sc-button" disabled={publishingId === v.id} onClick={() => publish(v.id)}>
                                      <span>{publishingId === v.id ? "Publishing..." : "Publish"}</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleDraft} className="tfcl-card p-3 mb-3 flex gap-10" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
                    <div className="form-group mb-0">
                      <label>Version label</label>
                      <input type="text" className="form-control" value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} required />
                    </div>
                    <div className="form-group mb-0">
                      <label>Effective from</label>
                      <input type="datetime-local" className="form-control" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} required />
                    </div>
                    <button type="submit" className="sc-button" disabled={drafting}>
                      <span>{drafting ? "Drafting..." : "Draft version"}</span>
                    </button>
                    {draftError && <div className="alert alert-danger mb-0">{draftError}</div>}
                  </form>

                  {selectedVersion && (
                    <div className="tfcl-card p-3">
                      <h4 className="mb-2">Tree — {selectedVersion.versionLabel}</h4>

                      {treeLoading && <p>Loading tree...</p>}
                      {!treeLoading && tree.length === 0 && <p className="tfcl-empty-data">No nodes yet — add a make to start.</p>}

                      {tree.length > 0 && (
                        <ul className="mb-3">
                          {flatNodes.map((n) => (
                            <li key={n.id}>{n.label} <span className="text-color-2">({n.type})</span></li>
                          ))}
                        </ul>
                      )}

                      {!selectedVersion.publishedAt && (
                        <form onSubmit={handleAddNode} className="flex gap-10" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
                          <div className="form-group mb-0">
                            <label>Type</label>
                            <select className="form-control" value={nodeType} onChange={(e) => { setNodeType(e.target.value as typeof nodeType); setParentId(""); }}>
                              <option value="make">Make</option>
                              <option value="model">Model</option>
                              <option value="derivative">Derivative</option>
                            </select>
                          </div>
                          {nodeType !== "make" && (
                            <div className="form-group mb-0">
                              <label>Parent</label>
                              <select className="form-control" value={parentId} onChange={(e) => setParentId(e.target.value)} required>
                                <option value="">Choose...</option>
                                {possibleParents.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                              </select>
                            </div>
                          )}
                          <div className="form-group mb-0">
                            <label>Name</label>
                            <input type="text" className="form-control" value={nodeName} onChange={(e) => setNodeName(e.target.value)} required />
                          </div>
                          <button type="submit" className="sc-button" disabled={adding}>
                            <span>{adding ? "Adding..." : "Add node"}</span>
                          </button>
                        </form>
                      )}
                      {addError && <div className="alert alert-danger mt-2">{addError}</div>}
                      {selectedVersion.publishedAt && <p className="text-color-2 mt-2">This version is published and read-only.</p>}
                    </div>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
