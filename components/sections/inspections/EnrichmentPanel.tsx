"use client";

import { useState, type FormEvent } from "react";
import { useVehicleEnrichment } from "@/hooks/useInspection";

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
    <div className="tfcl-card p-3 mb-3">
      <h4 className="mb-2">Enrichment</h4>

      <div className="row">
        <div className="col-md-6">
          <form onSubmit={handleVesSubmit} className="flex gap-10 mb-1">
            <input
              type="text"
              className="form-control"
              placeholder="VRM (e.g. AB12CDE)"
              value={vrm}
              onChange={(e) => setVrm(e.target.value)}
              maxLength={10}
              required
            />
            <button type="submit" className="sc-button" disabled={vesLoading}>
              <span>{vesLoading ? "Looking up..." : "VES lookup"}</span>
            </button>
          </form>
          {vesError && <div className="alert alert-danger mb-2">{vesError}</div>}
        </div>

        <div className="col-md-6">
          <div className="flex gap-10 mb-1">
            <span className="text-color-2">VIN: {vin}</span>
            <button type="button" className="sc-button" disabled={vinLoading} onClick={runVinDecode}>
              <span>{vinLoading ? "Decoding..." : "Decode VIN"}</span>
            </button>
          </div>
          {vinError && <div className="alert alert-danger mb-2">{vinError}</div>}
        </div>
      </div>

      <div className="mt-2">
        <button type="button" className="sc-button" disabled={motLoading} onClick={runMotRefresh}>
          <span>{motLoading ? "Refreshing..." : "Refresh MOT history"}</span>
        </button>
        {motError && <div className="alert alert-danger mt-2">{motError}</div>}

        {motHistory && motHistory.length === 0 && <p className="tfcl-empty-data mt-2">No MOT history found.</p>}

        {motHistory && motHistory.length > 0 && (
          <div className="table-responsive mt-2">
            <table className="table">
              <thead>
                <tr>
                  <th>Test date</th>
                  <th>Result</th>
                  <th>Odometer</th>
                  <th>Advisories</th>
                </tr>
              </thead>
              <tbody>
                {motHistory.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.testDate).toLocaleDateString()}</td>
                    <td className="text-capitalize">{entry.result}</td>
                    <td>{entry.odometerValue?.toLocaleString() ?? "-"}</td>
                    <td>{entry.advisories.length > 0 ? entry.advisories.map((a) => a.description).join("; ") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
