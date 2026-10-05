"use client";

import { useState, type FormEvent } from "react";
import SuperAdminShell from "./SuperAdminShell";
import { Badge, Card, EmptyState, ErrorNotice, LoadingRows, Modal, Tabs, useToast, type Tone } from "@/components/admin/ui";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import { useInspectionAssignments } from "@/hooks/useInspectionAssignments";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { formatWhen } from "@/lib/superAdmin";

const VIEWS = ["assigned", "completed", "cancelled"] as const;
const TONE: Record<string, Tone> = { assigned: "primary", completed: "success", cancelled: "neutral" };

/**
 * SRS §2.2 P6: a Quality Supervisor (or Super Admin) assigns vehicles to inspectors. An
 * inspector can only capture and report on what's assigned to them.
 */
export default function InspectionAssignments() {
  const { notify } = useToast();
  const [view, setView] = useState<(typeof VIEWS)[number]>("assigned");
  const { assignments, loading, error, reload } = useInspectionAssignments(view);
  const inspectors = useAdminResource<{ data: { id: number; name: string; email: string }[] }>("/inspection-assignments/inspectors");
  const [open, setOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [inspectorId, setInspectorId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function assign(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await apiFetch("/inspection-assignments", {
        method: "POST",
        body: { vehicle_master_record_id: vehicleId.trim(), inspector_user_id: Number(inspectorId), note: note.trim() || null },
      });
      notify("Inspection assigned.");
      setOpen(false);
      setVehicleId("");
      setNote("");
      reload();
    } catch (err) {
      setFormError(describeApiError(err, "Could not assign that inspection."));
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id: number) {
    try {
      await apiFetch(`/inspection-assignments/${id}/cancel`, { method: "POST" });
      notify("Assignment cancelled.");
      reload();
    } catch (err) {
      notify(describeApiError(err, "Could not cancel it."), { error: true });
    }
  }

  return (
    <SuperAdminShell
      title="Inspection assignments"
      intro="Inspectors can only work on vehicles assigned to them. Assign a vehicle to an inspector, follow progress, and cancel an assignment that's no longer needed."
      actions={<button type="button" className="ha-btn is-primary" onClick={() => { setOpen(true); setFormError(null); }}>+ Assign a vehicle</button>}
    >
      <Card>
        <div className="ha-toolbar">
          <Tabs label="Status" value={view} options={VIEWS} onChange={setView} />
        </div>
        {loading && <LoadingRows />}
        {error && <ErrorNotice message={error} />}
        {!loading && !error && assignments.length === 0 && <EmptyState icon="icon-carus-checkcircle" title={`No ${view} inspections`} />}
        {assignments.length > 0 && (
          <div className="ha-table-wrap">
            <table className="ha-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Inspector</th>
                  <th>Assigned</th>
                  <th>Status</th>
                  <th className="ha-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="ha-primary-text">{a.vehicle.title || "Vehicle"}</div>
                      <div className="ha-sub">{a.vehicle.vrm ?? "No VRM"} · <code>{a.vehicle.id}</code></div>
                    </td>
                    <td>{a.inspector?.name ?? "—"}</td>
                    <td className="ha-sub">{formatWhen(a.assigned_at)}{a.assigned_by ? ` · ${a.assigned_by}` : ""}{a.note ? ` · ${a.note}` : ""}</td>
                    <td><Badge tone={TONE[a.status] ?? "neutral"}>{a.status}</Badge>{a.completed_at && <div className="ha-sub">{formatWhen(a.completed_at)}</div>}</td>
                    <td className="ha-right">
                      {a.status === "assigned" && <button type="button" className="ha-btn is-sm is-danger" onClick={() => cancel(a.id)}>Cancel</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => !busy && setOpen(false)} title="Assign a vehicle" description="The inspector will see it on their My inspections list.">
        <form onSubmit={assign}>
          <div className="ha-field">
            <label htmlFor="ia-vehicle">Vehicle ID</label>
            <input id="ia-vehicle" className="ha-input" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} placeholder="The vehicle's public ID" required />
          </div>
          <div className="ha-field">
            <label htmlFor="ia-inspector">Inspector</label>
            <select id="ia-inspector" className="ha-select" value={inspectorId} onChange={(e) => setInspectorId(e.target.value)} required>
              <option value="">Choose...</option>
              {(inspectors.data?.data ?? []).map((i) => <option key={i.id} value={i.id}>{i.name} ({i.email})</option>)}
            </select>
          </div>
          <div className="ha-field">
            <label htmlFor="ia-note">Note (optional)</label>
            <input id="ia-note" className="ha-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
          </div>
          {formError && <div className="ha-alert is-danger">{formError}</div>}
          <div className="ha-modal-foot" style={{ padding: "4px 0 0" }}>
            <button type="button" className="ha-btn" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
            <button type="submit" className="ha-btn is-primary" disabled={busy || !vehicleId.trim() || !inspectorId}>{busy ? "Assigning..." : "Assign"}</button>
          </div>
        </form>
      </Modal>
    </SuperAdminShell>
  );
}
