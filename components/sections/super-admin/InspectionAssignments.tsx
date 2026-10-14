"use client";

import { useState, type FormEvent } from "react";
import SuperAdminShell from "./SuperAdminShell";
import { Badge, Card, EmptyState, ErrorNotice, FilterChips, LoadingRows, Modal, Pager, SearchInput, Tabs, useToast, type Tone } from "@/components/admin/ui";
import VehiclePicker, { type PickedVehicle } from "@/components/ui/VehiclePicker";
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
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const { assignments, loading, error, reload, lastPage, total } = useInspectionAssignments(view, page);
  const inspectors = useAdminResource<{ data: { id: number; name: string; email: string }[] }>("/inspection-assignments/inspectors");
  const [open, setOpen] = useState(false);
  const [vehicle, setVehicle] = useState<PickedVehicle | null>(null);
  const [inspectorId, setInspectorId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const needle = filter.trim().toLowerCase();
  const visible = needle
    ? assignments.filter((a) => [a.vehicle.title, a.vehicle.vrm, a.inspector?.name, a.note, a.assigned_by].some((field) => field?.toLowerCase().includes(needle)))
    : assignments;

  async function assign(event: FormEvent) {
    event.preventDefault();
    if (!vehicle) return;
    setBusy(true);
    setFormError(null);
    try {
      await apiFetch("/inspection-assignments", {
        method: "POST",
        body: { vehicle_master_record_id: vehicle.id, inspector_user_id: Number(inspectorId), note: note.trim() || null },
      });
      notify("Inspection assigned.");
      setOpen(false);
      setVehicle(null);
      setInspectorId("");
      setNote("");
      setPage(1);
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
          <Tabs label="Status" value={view} options={VIEWS} onChange={(next) => { setView(next); setPage(1); }} />
          <SearchInput label="Search this page" placeholder="Search vehicle, registration or inspector" value={filter} onChange={setFilter} />
        </div>
        <FilterChips filters={[filter.trim() !== "" && { key: "q", label: `“${filter.trim()}”`, onRemove: () => setFilter("") }]} onClearAll={() => setFilter("")} />
        {loading && <LoadingRows />}
        {error && <ErrorNotice message={error} />}
        {!loading && !error && assignments.length === 0 && (
          <EmptyState
            icon="icon-carus-checkcircle"
            title={`No ${view} inspections`}
            text={view === "assigned" ? "Assign a vehicle to an inspector to get started." : undefined}
            action={view === "assigned" ? <button type="button" className="ha-btn is-primary" onClick={() => { setOpen(true); setFormError(null); }}>+ Assign a vehicle</button> : undefined}
          />
        )}
        {!loading && assignments.length > 0 && visible.length === 0 && (
          <EmptyState icon="icon-carus-search" title="No matches on this page" text="Try a different search." action={<button type="button" className="ha-btn" onClick={() => setFilter("")}>Clear search</button>} />
        )}
        {visible.length > 0 && (
          <div className="ha-table-wrap">
            <table className="ha-table"><caption className="ha-visually-hidden">Inspection assignments</caption>
              <thead>
                <tr>
                  <th scope="col">Vehicle</th>
                  <th scope="col">Inspector</th>
                  <th scope="col">Assigned</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="ha-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="ha-primary-text">{a.vehicle.title || "Vehicle"}</div>
                      <div className="ha-sub">{a.vehicle.vrm ? <code>{a.vehicle.vrm}</code> : "No registration"}</div>
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
        <Pager page={page} lastPage={lastPage} total={total} onChange={setPage} />
      </Card>

      <Modal open={open} onClose={() => !busy && setOpen(false)} title="Assign a vehicle" description="Find the vehicle by registration or make and model. The inspector will see it on their My inspections list.">
        <form onSubmit={assign}>
          <VehiclePicker value={vehicle} onChange={setVehicle} inspectorId={inspectorId ? Number(inspectorId) : null} />
          <div className="ha-field">
            <label htmlFor="ia-inspector">Inspector</label>
            <select id="ia-inspector" className="ha-select" value={inspectorId} onChange={(e) => setInspectorId(e.target.value)} required>
              <option value="">Choose an inspector…</option>
              {(inspectors.data?.data ?? []).map((i) => <option key={i.id} value={i.id}>{i.name} ({i.email})</option>)}
            </select>
          </div>
          <div className="ha-field">
            <label htmlFor="ia-note">Note (optional)</label>
            <input id="ia-note" className="ha-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
          </div>
          {formError && <div className="ha-alert is-danger" role="alert">{formError}</div>}
          <div className="ha-modal-foot" style={{ padding: "4px 0 0" }}>
            <button type="button" className="ha-btn" onClick={() => setOpen(false)} disabled={busy}>Close</button>
            <button type="submit" className="ha-btn is-primary" disabled={busy || !vehicle || !inspectorId} aria-busy={busy}>{busy ? "Assigning…" : "Assign"}</button>
          </div>
        </form>
      </Modal>
    </SuperAdminShell>
  );
}
