"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Modal, useToast } from "@/components/admin/ui";
import { runAdminAction } from "@/hooks/useSuperAdmin";
import { TICKET_PATTERN } from "@/lib/superAdmin";

/**
 * A Super Admin action: a button that opens a dialog asking for the mandatory reason and
 * ticket reference (§2.2 P7: "every action justified via linked ticket reference"). Four-eyes
 * actions say up front that a second Super Admin must approve, and come back as a pending
 * request rather than taking effect.
 */
export default function JustifiedAction({
  label,
  title,
  description,
  path,
  extra,
  fourEyes = false,
  danger = false,
  primary = false,
  disabled = false,
  extraFields,
  canSubmit = true,
  onDone,
}: {
  label: string;
  title?: string;
  description?: ReactNode;
  path: string;
  extra?: Record<string, unknown>;
  fourEyes?: boolean;
  danger?: boolean;
  primary?: boolean;
  disabled?: boolean;
  extraFields?: ReactNode;
  canSubmit?: boolean;
  onDone: () => void;
}) {
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [ticket, setTicket] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ticketValid = TICKET_PATTERN.test(ticket.trim());
  const reasonValid = reason.trim().length >= 10;

  function close() {
    if (busy) return;
    setOpen(false);
    setError(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await runAdminAction(path, { reason: reason.trim(), ticket_reference: ticket.trim() }, extra);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    notify(result.pendingApproval ? `${label}: sent for approval by a second Super Admin.` : `${label}: done.`);
    setOpen(false);
    setReason("");
    setTicket("");
    onDone();
  }

  const buttonClass = `ha-btn is-sm${danger ? " is-danger" : ""}${primary ? " is-primary" : ""}`;

  return (
    <>
      <button type="button" className={buttonClass} disabled={disabled} onClick={() => setOpen(true)}>
        {label}
      </button>
      <Modal
        open={open}
        onClose={close}
        title={title ?? label}
        description={description}
      >
        <form onSubmit={submit}>
          {fourEyes && (
            <div className="ha-alert is-info">
              <b>Four-eyes action.</b> This is raised as a request and only takes effect once a different Super Admin approves it.
            </div>
          )}
          {extraFields}
          <div className="ha-field">
            <label htmlFor="ja-reason">Reason</label>
            <textarea
              id="ja-reason"
              className="ha-textarea"
              placeholder="Why is this needed? (at least 10 characters)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={2000}
              autoFocus
            />
          </div>
          <div className="ha-field">
            <label htmlFor="ja-ticket">Ticket reference</label>
            <input
              id="ja-ticket"
              className="ha-input"
              placeholder="e.g. OPS-1234"
              value={ticket}
              onChange={(e) => setTicket(e.target.value.toUpperCase())}
              maxLength={30}
            />
            {ticket !== "" && !ticketValid ? (
              <div className="ha-error-text">Use a project key, a dash and a number — like OPS-1234.</div>
            ) : (
              <div className="ha-hint">Every admin action is linked to a ticket and recorded in the audit log.</div>
            )}
          </div>
          {error && (
            <div className="ha-alert is-danger" role="alert">
              {error}
            </div>
          )}
          <div className="ha-modal-foot" style={{ padding: "4px 0 0" }}>
            <button type="button" className="ha-btn" onClick={close} disabled={busy}>
              Cancel
            </button>
            <button
              type="submit"
              className={`ha-btn ${danger ? "is-danger-solid" : "is-primary"}`}
              disabled={busy || !ticketValid || !reasonValid || !canSubmit}
            >
              {busy ? "Working..." : fourEyes ? "Request approval" : "Confirm"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
