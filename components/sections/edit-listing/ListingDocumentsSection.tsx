"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useVehicleDocuments } from "@/hooks/useVehicleDocuments";

const LABELS: Record<string, string> = {
  v5c: "V5C logbook",
  mot: "MOT certificate",
  service_history: "Service history",
  other: "Other document",
};

/**
 * FR-C-001: documents the reviewer checks before your listing goes live — PDF, JPG or PNG, up to
 * 10 MB each. Only you and HMP's reviewers can open them; they're never shown publicly.
 */
export default function ListingDocumentsSection({ vehiclePublicId }: { vehiclePublicId: string }) {
  const { documents, types, loading, busy, progress, error, add, remove, download } = useVehicleDocuments(vehiclePublicId);
  const [type, setType] = useState("v5c");
  const fileInput = useRef<HTMLInputElement>(null);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) add(file, type);
  }

  return (
    <div className="tfcl-card p-3 mb-3">
      <h4 className="mb-1">Documents</h4>
      <p className="text-color-2 fs-13 mb-3">
        Add your V5C logbook, MOT and service history. Our reviewers check them before your listing goes live; they&apos;re
        never shown to buyers.
      </p>

      {loading && <p>Loading documents...</p>}
      {!loading && documents.length === 0 && <p className="text-color-2">No documents yet.</p>}
      {documents.length > 0 && (
        <ul className="list-unstyled mb-3">
          {documents.map((doc) => (
            <li key={doc.id} className="d-flex align-items-center justify-content-between gap-2 py-2" style={{ borderBottom: "1px solid #eee" }}>
              <div>
                <b>{LABELS[doc.type] ?? doc.type}</b>
                <div className="fs-13 text-color-2">
                  {doc.original_name} · {(doc.size_bytes / 1024).toFixed(0)} KB
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="sc-button" onClick={() => download(doc)}>
                  <span>View</span>
                </button>
                <button type="button" className="sc-button" onClick={() => remove(doc.id)}>
                  <span>Remove</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="d-flex flex-wrap gap-2 align-items-center">
        <select className="form-control" style={{ maxWidth: 220 }} aria-label="Document type" value={type} onChange={(e) => setType(e.target.value)} disabled={busy}>
          {(types.length ? types : Object.keys(LABELS)).map((t) => (
            <option key={t} value={t}>
              {LABELS[t] ?? t}
            </option>
          ))}
        </select>
        <button type="button" className="sc-button" disabled={busy} onClick={() => fileInput.current?.click()}>
          <span>{busy ? `Uploading... ${Math.round(progress)}%` : "Upload document"}</span>
        </button>
        <input ref={fileInput} type="file" accept="application/pdf,image/jpeg,image/png" hidden onChange={handleFile} />
      </div>
      {error && <div className="alert alert-danger mt-2 mb-0">{error}</div>}
    </div>
  );
}
