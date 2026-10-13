"use client";

import { useState, type FormEvent } from "react";
import { useVehicleEnrichment } from "@/hooks/useInspection";
import { DataTable, Notice, StatusBadge } from "@/components/ui/kit";

/** FR-A-002/003/005: VES lookup, VIN decode, and MOT history refresh for the vehicle being inspected. */
export default function EnrichmentPanel({ vehiclePublicId, vin, onEnriched }: { vehiclePublicId: string; vin: string; onEnriched: () => void }) {
  const {
    runVesLookup,
    vesLoading,
    vesError,
    runVinDecode,
    vinLoading,
    vinError,
    runMotRefresh,
    motLoading,
    motError,
    motHistory,
  } = useVehicleEnrichment(vehiclePublicId, onEnriched);

  const [vrm, setVrm] = useState("");

  async function handleVesSubmit(event: FormEvent) {
    event.preventDefault();
    if (!vrm.trim()) return;
    const ok = await runVesLookup(vrm.trim());
    if (ok) setVrm("");
  }

  return (
    <div className="ha-card ha-card-body mb-4">
      <h2 className="hd-card-title">Enrichment</h2>

      <div className="ha-grid is-2">
        <div>
          <form onSubmit={handleVesSubmit} className="ha-actions is-start mb-2">
            <input
              type="text"
              className="ha-input"
              style={{ maxWidth: 200 }}
              aria-label="Registration (VRM)"
              placeholder="VRM (e.g. AB12CDE)"
              value={vrm}
              onChange={(e) => setVrm(e.target.value)}
              maxLength={10}
              required
            />
            <button type="submit" className="ha-btn is-primary" disabled={vesLoading}>{vesLoading ? "Looking up…" : "VES lookup"}</button>
          </form>
          {vesError && <Notice tone="danger">{vesError}</Notice>}
        </div>

        <div>
          <div className="ha-actions is-start mb-2">
            <span className="ha-muted">VIN <code>{vin}</code></span>
            <button type="button" className="ha-btn" disabled={vinLoading} onClick={runVinDecode}>{vinLoading ? "Decoding…" : "Decode VIN"}</button>
          </div>
          {vinError && <Notice tone="danger">{vinError}</Notice>}
        </div>
      </div>

      <div className="mt-2">
        <button type="button" className="ha-btn" disabled={motLoading} onClick={runMotRefresh}>{motLoading ? "Refreshing…" : "Refresh MOT history"}</button>
        {motError && <Notice tone="danger">{motError}</Notice>}

        {motHistory && motHistory.length === 0 && <p className="tfcl-empty-data mt-2">No MOT history found.</p>}

        {motHistory && motHistory.length > 0 && (
          <div className="mt-3">
            <DataTable caption="MOT history">
              <thead>
                <tr>
                  <th scope="col">Test date</th>
                  <th scope="col">Result</th>
                  <th scope="col">Odometer</th>
                  <th scope="col">Advisories</th>
                </tr>
              </thead>
              <tbody>
                {motHistory.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.testDate).toLocaleDateString()}</td>
                    <td><StatusBadge status={entry.result} tone={/pass/i.test(entry.result) ? "success" : /fail/i.test(entry.result) ? "danger" : undefined} /></td>
                    <td>{entry.odometerValue?.toLocaleString() ?? "-"}</td>
                    <td>{entry.advisories.length > 0 ? entry.advisories.map((a) => a.description).join("; ") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>
        )}
      </div>
    </div>
  );
}
