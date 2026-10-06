"use client";

import { useState } from "react";
import SuperAdminShell from "./SuperAdminShell";
import { Badge, Card, EmptyState, ErrorNotice, LoadingRows, Modal, Pager, Tabs, useToast, type Tone } from "@/components/admin/ui";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { actionLabel, formatWhen, pageInfo, type AdminActionRequest, type Paginated } from "@/lib/superAdmin";

const STATUSES = ["pending", "approved", "rejected", "cancelled", "expired", "all"] as const;
const STATUS_TONE: Record<string, Tone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
  expired: "neutral",
};

type Decision = { request: AdminActionRequest; kind: "approve" | "reject" | "cancel" };

function DecisionDialog({ decision, onClose, onDone }: { decision: Decision | null; onClose: () => void; onDone: () => void }) {
  const { notify } = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!decision) return null;
  const { request, kind } = decision;
  const verb = kind === "approve" ? "Approve" : kind === "reject" ? "Reject" : "Cancel";

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/admin/action-requests/${request.id}/${kind}`, {
        method: "POST",
        body: kind === "cancel" ? undefined : { note: note.trim() || null },
      });
      notify(kind === "approve" ? `Approved — ${actionLabel(request.action).toLowerCase()} has taken effect.` : kind === "reject" ? "Request rejected." : "Request cancelled.");
      setNote("");
      onDone();
      onClose();
    } catch (err) {
      setError(describeApiError(err, "Could not record that decision."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={() => !busy && onClose()}
      title={`${verb} request`}
      description={`${actionLabel(request.action)} — ${request.target_label ?? `${request.target_kind} #${request.target_id}`}`}
      footer={
        <>
          <button type="button" className="ha-btn" onClick={onClose} disabled={busy}>Back</button>
          <button type="button" className={`ha-btn ${kind === "approve" ? "is-primary" : "is-danger-solid"}`} onClick={submit} disabled={busy}>
            {busy ? "Working..." : verb}
          </button>
        </>
      }
    >
      <div className="ha-alert is-info" style={{ marginBottom: 12 }}>
        <div><b>Reason:</b> {request.reason}</div>
        <div><b>Ticket:</b> {request.ticket_reference} · <b>Raised by:</b> {request.requested_by?.name ?? "-"}</div>
      </div>
      {kind === "approve" && <p className="ha-sub" style={{ marginBottom: 12 }}>Approving runs the action immediately.</p>}
      {kind !== "cancel" && (
        <div className="ha-field">
          <label htmlFor="decision-note">Note (optional)</label>
          <textarea id="decision-note" className="ha-textarea" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
        </div>
      )}
      {error && <div className="ha-alert is-danger" role="alert">{error}</div>}
    </Modal>
  );
}

/**
 * §2.2 P7 dual control: destructive overrides wait here until a *different* Super Admin approves
 * them. You can't approve your own request, nor one that targets your own account.
 */
export default function Approvals() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("pending");
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState<Decision | null>(null);
  const { data, loading, error, reload } = useAdminResource<Paginated<AdminActionRequest>>(`/admin/action-requests?status=${status}&page=${page}`);
  const info = data ? pageInfo(data) : null;

  return (
    <SuperAdminShell
      title="Approvals"
      intro="Freezing accounts, taking down listings, suspending organizations, role changes and permission changes only take effect once a second Super Admin approves."
    >
      <Card>
        <div className="ha-toolbar">
          <Tabs label="Request status" value={status} options={STATUSES} onChange={(next) => { setStatus(next); setPage(1); }} />
        </div>
        {loading && !data && <LoadingRows />}
        {error && <ErrorNotice message={error} />}
        {data && data.data.length === 0 && (
          <EmptyState icon="icon-carus-checkcircle" title={status === "pending" ? "No pending requests" : "Nothing here"} text={status === "pending" ? "When a Super Admin raises a four-eyes action it appears here." : undefined} />
        )}
        {data && data.data.length > 0 && (
          <div className="ha-table-wrap">
            <table className="ha-table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Reason</th>
                  <th>Raised by</th>
                  <th>Status</th>
                  <th className="ha-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((request) => {
                  const role = typeof request.payload.role === "string" ? request.payload.role : null;
                  const permission = typeof request.payload.permission === "string" ? request.payload.permission : null;
                  return (
                    <tr key={request.id}>
                      <td>
                        <div className="ha-primary-text">
                          {actionLabel(request.action)} {(role || permission) && <code>{role ?? permission}</code>}
                        </div>
                        <div className="ha-sub">{request.target_label ?? `${request.target_kind} #${request.target_id}`}</div>
                      </td>
                      <td style={{ maxWidth: 320 }}>
                        <div>{request.reason}</div>
                        <div className="ha-sub">Ticket {request.ticket_reference}</div>
                      </td>
                      <td>
                        <div>{request.requested_by?.name ?? "-"}</div>
                        <div className="ha-sub">{formatWhen(request.created_at)}</div>
                      </td>
                      <td>
                        <Badge tone={STATUS_TONE[request.status] ?? "neutral"}>{request.status}</Badge>
                        <div className="ha-sub" style={{ marginTop: 4 }}>
                          {request.status === "pending"
                            ? `Expires ${formatWhen(request.expires_at)}`
                            : request.decided_by
                              ? `by ${request.decided_by.name}${request.decision_note ? ` — ${request.decision_note}` : ""}`
                              : ""}
                        </div>
                      </td>
                      <td>
                        <div className="ha-actions">
                          {request.can_decide && (
                            <>
                              <button type="button" className="ha-btn is-sm is-primary" onClick={() => setDecision({ request, kind: "approve" })}>Approve</button>
                              <button type="button" className="ha-btn is-sm is-danger" onClick={() => setDecision({ request, kind: "reject" })}>Reject</button>
                            </>
                          )}
                          {request.can_cancel && (
                            <>
                              <span className="ha-sub" style={{ alignSelf: "center" }}>Awaiting another admin</span>
                              <button type="button" className="ha-btn is-sm" onClick={() => setDecision({ request, kind: "cancel" })}>Cancel</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {info && <Pager page={info.page} lastPage={info.lastPage} total={info.total} onChange={setPage} />}
      </Card>
      <DecisionDialog decision={decision} onClose={() => setDecision(null)} onDone={reload} />
    </SuperAdminShell>
  );
}
