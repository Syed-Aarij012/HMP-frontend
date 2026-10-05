"use client";

import { useState, type FormEvent } from "react";
import SuperAdminShell from "./SuperAdminShell";
import { Badge, Card, EmptyState, ErrorNotice, LoadingRows, Modal, useToast } from "@/components/admin/ui";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { formatWhen, TICKET_PATTERN, type FeatureFlag } from "@/lib/superAdmin";

function JustificationFields({ reason, ticket, onReason, onTicket }: { reason: string; ticket: string; onReason: (v: string) => void; onTicket: (v: string) => void }) {
  return (
    <>
      <div className="ha-field">
        <label htmlFor="ff-reason">Reason</label>
        <textarea id="ff-reason" className="ha-textarea" placeholder="At least 10 characters" value={reason} onChange={(e) => onReason(e.target.value)} />
      </div>
      <div className="ha-field">
        <label htmlFor="ff-ticket">Ticket reference</label>
        <input id="ff-ticket" className="ha-input" placeholder="e.g. OPS-1234" value={ticket} onChange={(e) => onTicket(e.target.value.toUpperCase())} />
        {ticket !== "" && !TICKET_PATTERN.test(ticket) && <div className="ha-error-text">Use a ticket reference like OPS-1234.</div>}
      </div>
    </>
  );
}

type Dialog = { kind: "toggle"; flag: FeatureFlag } | { kind: "create" } | null;

/** §2.2 P7 "feature-flag control" (NFR-O-004). Every change is ticketed and audited. */
export default function FeatureFlags() {
  const { notify } = useToast();
  const { data, loading, error, reload } = useAdminResource<{ data: FeatureFlag[] }>("/admin/feature-flags");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [reason, setReason] = useState("");
  const [ticket, setTicket] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function open(next: Dialog) {
    setReason("");
    setTicket("");
    setFormError(null);
    if (next?.kind === "create") {
      setKey("");
      setDescription("");
      setEnabled(false);
    }
    setDialog(next);
  }

  const justified = reason.trim().length >= 10 && TICKET_PATTERN.test(ticket);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!dialog) return;
    setBusy(true);
    setFormError(null);
    try {
      if (dialog.kind === "toggle") {
        await apiFetch(`/admin/feature-flags/${dialog.flag.id}`, {
          method: "PATCH",
          body: { enabled: !dialog.flag.enabled, reason: reason.trim(), ticket_reference: ticket.trim() },
        });
        notify(`${dialog.flag.key} switched ${dialog.flag.enabled ? "off" : "on"}.`);
      } else {
        await apiFetch("/admin/feature-flags", {
          method: "POST",
          body: { key: key.trim(), description: description.trim() || null, enabled, reason: reason.trim(), ticket_reference: ticket.trim() },
        });
        notify(`Flag ${key.trim()} created.`);
      }
      setDialog(null);
      reload();
    } catch (err) {
      setFormError(describeApiError(err, "Could not save the flag."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SuperAdminShell
      title="Feature flags"
      intro="Turn platform features on or off. Every change needs a reason and a ticket, and is recorded in the audit log."
      actions={<button type="button" className="ha-btn is-primary" onClick={() => open({ kind: "create" })}>+ New flag</button>}
    >
      <Card>
        {loading && !data && <LoadingRows />}
        {error && <ErrorNotice message={error} />}
        {data && data.data.length === 0 && <EmptyState icon="icon-carus-power" title="No flags yet" text="Create one with “New flag”." />}
        {data && data.data.length > 0 && (
          <div className="ha-table-wrap">
            <table className="ha-table">
              <thead>
                <tr>
                  <th>Flag</th>
                  <th>State</th>
                  <th>Last changed</th>
                  <th className="ha-right">On / off</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((flag) => (
                  <tr key={flag.id}>
                    <td>
                      <code>{flag.key}</code>
                      {flag.description && <div className="ha-sub" style={{ marginTop: 4 }}>{flag.description}</div>}
                    </td>
                    <td><Badge tone={flag.enabled ? "success" : "neutral"}>{flag.enabled ? "On" : "Off"}</Badge></td>
                    <td>
                      <div>{flag.updated_by?.name ?? "—"}</div>
                      <div className="ha-sub">{formatWhen(flag.updated_at)}</div>
                    </td>
                    <td>
                      <div className="ha-actions">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={flag.enabled}
                          aria-label={`${flag.enabled ? "Switch off" : "Switch on"} ${flag.key}`}
                          className={`ha-switch${flag.enabled ? " is-on" : ""}`}
                          onClick={() => open({ kind: "toggle", flag })}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={dialog !== null}
        onClose={() => !busy && setDialog(null)}
        title={dialog?.kind === "toggle" ? `Switch ${dialog.flag.enabled ? "off" : "on"} ${dialog.flag.key}` : "New feature flag"}
        description={dialog?.kind === "toggle" ? dialog.flag.description ?? undefined : "Flags start off unless you switch them on here."}
      >
        <form onSubmit={submit}>
          {dialog?.kind === "create" && (
            <>
              <div className="ha-field">
                <label htmlFor="ff-key">Key</label>
                <input id="ff-key" className="ha-input" placeholder="e.g. auction.video_simulcast" value={key} onChange={(e) => setKey(e.target.value.toLowerCase())} maxLength={100} />
                <div className="ha-hint">Lower-case letters and numbers, separated by dots, dashes or underscores.</div>
              </div>
              <div className="ha-field">
                <label htmlFor="ff-desc">What it controls</label>
                <input id="ff-desc" className="ha-input" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={255} />
              </div>
              <label className="ha-check" style={{ marginBottom: 14 }}>
                <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Switch it on straight away
              </label>
            </>
          )}
          <JustificationFields reason={reason} ticket={ticket} onReason={setReason} onTicket={setTicket} />
          {formError && <div className="ha-alert is-danger" role="alert">{formError}</div>}
          <div className="ha-modal-foot" style={{ padding: "4px 0 0" }}>
            <button type="button" className="ha-btn" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
            <button type="submit" className="ha-btn is-primary" disabled={busy || !justified || (dialog?.kind === "create" && !key.trim())}>
              {busy ? "Saving..." : dialog?.kind === "create" ? "Create flag" : "Confirm"}
            </button>
          </div>
        </form>
      </Modal>
    </SuperAdminShell>
  );
}
