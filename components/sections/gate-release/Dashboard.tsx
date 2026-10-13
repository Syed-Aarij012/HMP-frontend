"use client";

import { useState, type FormEvent } from "react";
import { useGateRelease } from "@/hooks/useGateRelease";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Badge, Notice } from "@/components/ui/kit";

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
    <DashboardPage title="Vehicle release (gate)" description={<>Enter the collector&apos;s release code shown on their phone, verify their photo ID, and complete the handover checklist to release the vehicle.</>}>
      {!releaseNote && (
        <form onSubmit={handleLookup} className="ha-card ha-card-body mb-4" style={{ maxWidth: 420 }}>
          <div className="ha-field">
            <label htmlFor="release-code">Release code</label>
            <input
              id="release-code"
              type="text"
              className="ha-input"
              style={{ height: 52, fontSize: 24, letterSpacing: 2, textTransform: "uppercase" }}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. A1B2C3D4"
              required
              autoFocus
            />
          </div>
          {error && <Notice tone="danger">{error}</Notice>}
          <button type="submit" className="ha-btn is-primary" disabled={loading || !code.trim()}>{loading ? "Looking up..." : "Find vehicle"}</button>
        </form>
      )}

      {releaseNote && (
        <div className="ha-card ha-card-body" style={{ maxWidth: 520 }}>
          {releaseNote.status === "released" || released ? (
            <>
              <Notice tone="success">Vehicle released.</Notice>
              <button type="button" className="ha-btn is-primary" onClick={startOver}>Release another vehicle</button>
            </>
          ) : releaseNote.status === "held" ? (
            <>
              <Notice tone="danger">
                Release is on hold{releaseNote.hold_reason ? `: ${releaseNote.hold_reason.replace(/_/g, " ")}` : ""}.
                This vehicle cannot be released — contact logistics.
              </Notice>
              <button type="button" className="ha-btn is-primary" onClick={startOver}>Start over</button>
            </>
          ) : (
            <form onSubmit={handleExecute}>
              <h2 className="hd-card-title"><Badge tone="success">Verified</Badge> Release code {code.toUpperCase()}</h2>

              <div className="ha-field">
                <label htmlFor="photo-id">Photo of collector&apos;s ID</label>
                <input
                  id="photo-id"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="ha-input"
                  onChange={(e) => setPhotoIdFile(e.target.files?.[0] ?? null)}
                  required
                />
              </div>

              <fieldset className="ha-field">
                <legend className="ha-label">Handover checklist</legend>
                {HANDOVER_CHECKLIST_KEYS.map((item) => (
                  <div key={item.key} className="ha-check mb-1">
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
                <p className="ha-sub mt-1">
                  Every item must be answered (ticked or left unticked) to confirm it was checked — a missing
                  spare key is still a completed, documented handover.
                </p>
              </fieldset>

              {error && <Notice tone="danger">{error}</Notice>}

              <div className="ha-actions is-start">
                <button type="submit" className="ha-btn is-primary" disabled={executing || !photoIdFile || !allChecked}>{executing ? "Releasing…" : "Release vehicle"}</button>
                <button type="button" className="ha-btn is-ghost" onClick={startOver}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}
    </DashboardPage>
  );
}
