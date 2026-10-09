"use client";

import { useState, type FormEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useGateRelease } from "@/hooks/useGateRelease";

const HANDOVER_CHECKLIST_KEYS = [
  { key: "keys_handed_over", label: "Keys handed over" },
  { key: "spare_key_handed_over", label: "Spare key handed over" },
  { key: "v5c_or_v5c_receipt_present", label: "V5C or V5C receipt present" },
  { key: "service_history_handed_over", label: "Service history handed over" },
];

/**
 * FR-F-010: the gate app — look a vehicle up by the collector's release code, capture a
 * photo of their ID, confirm the handover checklist, and release. A lot/order is only
 * releasable once payment has cleared and no hold (dispute, provenance re-check) is active,
 * all enforced server-side; this is just the first UI that reaches that enforcement.
 */
export default function Dashboard() {
  const { releaseNote, loading, error, executing, lookup, execute, reset } = useGateRelease();
  const [code, setCode] = useState("");
  const [photoIdFile, setPhotoIdFile] = useState<File | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    Object.fromEntries(HANDOVER_CHECKLIST_KEYS.map((item) => [item.key, false])),
  );
  const [released, setReleased] = useState(false);

  async function handleLookup(event: FormEvent) {
    event.preventDefault();
    setReleased(false);
    await lookup(code.trim().toUpperCase());
  }

  async function handleExecute(event: FormEvent) {
    event.preventDefault();
    if (!photoIdFile) return;
    const ok = await execute(code.trim().toUpperCase(), photoIdFile, checklist);
    if (ok) setReleased(true);
  }

  function startOver() {
    reset();
    setCode("");
    setPhotoIdFile(null);
    setChecklist(Object.fromEntries(HANDOVER_CHECKLIST_KEYS.map((item) => [item.key, false])));
    setReleased(false);
  }

  const allChecked = HANDOVER_CHECKLIST_KEYS.every((item) => checklist[item.key] !== undefined);

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">Vehicle release (gate)</h1>
                  <p className="text-color-2 mb-3">
                    Enter the collector&apos;s release code shown on their phone, verify their photo ID, and complete the
                    handover checklist to release the vehicle.
                  </p>

                  {!releaseNote && (
                    <form onSubmit={handleLookup} className="tfcl-card p-3 mb-3" style={{ maxWidth: 420 }}>
                      <div className="form-group mb-2">
                        <label htmlFor="release-code">Release code</label>
                        <input
                          id="release-code"
                          type="text"
                          className="form-control"
                          style={{ fontSize: 24, letterSpacing: 2, textTransform: "uppercase" }}
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          placeholder="e.g. A1B2C3D4"
                          required
                          autoFocus
                        />
                      </div>
                      {error && <div className="alert alert-danger">{error}</div>}
                      <button type="submit" className="sc-button" disabled={loading || !code.trim()}>
                        <span>{loading ? "Looking up..." : "Find vehicle"}</span>
                      </button>
                    </form>
                  )}

                  {releaseNote && (
                    <div className="tfcl-card p-3" style={{ maxWidth: 520 }}>
                      {releaseNote.status === "released" || released ? (
                        <>
                          <div className="alert alert-success">Vehicle released.</div>
                          <button type="button" className="sc-button" onClick={startOver}>
                            <span>Release another vehicle</span>
                          </button>
                        </>
                      ) : releaseNote.status === "held" ? (
                        <>
                          <div className="alert alert-danger">
                            Release is on hold{releaseNote.hold_reason ? `: ${releaseNote.hold_reason.replace(/_/g, " ")}` : ""}.
                            This vehicle cannot be released — contact logistics.
                          </div>
                          <button type="button" className="sc-button" onClick={startOver}>
                            <span>Start over</span>
                          </button>
                        </>
                      ) : (
                        <form onSubmit={handleExecute}>
                          <h4 className="mb-2">Release code {code.toUpperCase()} verified</h4>

                          <div className="form-group mb-3">
                            <label htmlFor="photo-id">Photo of collector&apos;s ID</label>
                            <input
                              id="photo-id"
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="form-control"
                              onChange={(e) => setPhotoIdFile(e.target.files?.[0] ?? null)}
                              required
                            />
                          </div>

                          <div className="form-group mb-3">
                            <label>Handover checklist</label>
                            {HANDOVER_CHECKLIST_KEYS.map((item) => (
                              <div key={item.key} className="flex gap-10 align-center mb-1">
                                <input
                                  id={`checklist-${item.key}`}
                                  type="checkbox"
                                  checked={checklist[item.key] ?? false}
                                  onChange={(e) => setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                                />
                                <label htmlFor={`checklist-${item.key}`} className="mb-0">
                                  {item.label}
                                </label>
                              </div>
                            ))}
                            <p className="fs-13 text-color-2 mt-1">
                              Every item must be answered (ticked or left unticked) to confirm it was checked — a missing
                              spare key is still a completed, documented handover.
                            </p>
                          </div>

                          {error && <div className="alert alert-danger">{error}</div>}

                          <div className="flex gap-10">
                            <button type="submit" className="sc-button" disabled={executing || !photoIdFile || !allChecked}>
                              <span>{executing ? "Releasing..." : "Release vehicle"}</span>
                            </button>
                            <button type="button" className="sc-button" onClick={startOver}>
                              <span>Cancel</span>
                            </button>
                          </div>
                        </form>
                      )}
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
