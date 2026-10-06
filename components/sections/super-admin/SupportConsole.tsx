"use client";

import { useState, type FormEvent } from "react";
import SuperAdminShell from "./SuperAdminShell";
import { Badge, Card, EmptyState, ErrorNotice, LoadingRows, Modal, SearchInput, useDebouncedValue, useToast, type Tone } from "@/components/admin/ui";
import { SUPPORT_ORIGINAL_TOKEN_KEY } from "@/components/common/SupportViewWatermark";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import { apiFetch, describeApiError, getStoredToken, setStoredToken } from "@/lib/api-client";
import { formatWhen, roleLabel } from "@/lib/superAdmin";

type FoundUser = { id: number; name: string; email: string; status: string; roles: string[] };
type Session = {
  id: number;
  status: string;
  reason: string;
  customer: { id: number; name: string; email: string } | null;
  requested_at: string | null;
  decided_at: string | null;
  expires_at: string | null;
};

const STATUS_TONE: Record<string, Tone> = { requested: "warning", approved: "success", active: "primary", denied: "danger", ended: "neutral", expired: "neutral" };

/**
 * SRS §2.2 Customer Support Agent — case management (find the customer) and the impersonation-
 * view: read-only, consented (the customer approves each request), watermarked.
 */
export default function SupportConsole() {
  const { notify } = useToast();
  const [q, setQ] = useState("");
  const search = useDebouncedValue(q.trim());
  const found = useAdminResource<{ data: FoundUser[] }>(search.length >= 2 ? `/support/users?q=${encodeURIComponent(search)}` : null);
  const sessions = useAdminResource<{ data: Session[] }>("/support/impersonations");
  const [target, setTarget] = useState<FoundUser | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function request(event: FormEvent) {
    event.preventDefault();
    if (!target) return;
    setBusy(true);
    setFormError(null);
    try {
      await apiFetch("/support/impersonations", { method: "POST", body: { user_id: target.id, reason: reason.trim() } });
      notify(`Request sent to ${target.name}. They need to allow it before you can view their account.`);
      setTarget(null);
      setReason("");
      sessions.reload();
    } catch (err) {
      setFormError(describeApiError(err, "Could not send the request."));
    } finally {
      setBusy(false);
    }
  }

  async function openView(session: Session) {
    try {
      const response = await apiFetch<{ data: { token: string } }>(`/support/impersonations/${session.id}/start`, { method: "POST" });
      const original = getStoredToken();
      if (original) window.localStorage.setItem(SUPPORT_ORIGINAL_TOKEN_KEY, original);
      setStoredToken(response.data.token);
      window.location.assign("/dashboard");
    } catch (err) {
      notify(describeApiError(err, "Could not open the support view."), { error: true });
    }
  }

  const isCustomer = (u: FoundUser) => u.roles.length > 0 && u.roles.every((r) => ["private_buyer", "private_seller", "trade_buyer"].includes(r) || r.startsWith("dealer_"));

  return (
    <SuperAdminShell
      title="Support view"
      intro="Find a customer and ask to see their account as they see it. They must allow each request; the view is read-only, watermarked on every page, ends by itself, and is recorded in the audit log."
    >
      <Card title="Find a customer">
        <div className="ha-toolbar">
          <SearchInput label="Search customers" placeholder="Name or email (2+ characters)" value={q} onChange={setQ} />
        </div>
        {found.loading && <LoadingRows rows={2} />}
        {found.error && <ErrorNotice message={found.error} />}
        {found.data && found.data.data.length === 0 && <EmptyState icon="icon-carus-profile" title="No one matches" />}
        {found.data && found.data.data.length > 0 && (
          <div className="ha-table-wrap">
            <table className="ha-table">
              <tbody>
                {found.data.data.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="ha-primary-text">{u.name}</div>
                      <div className="ha-sub">{u.email}</div>
                    </td>
                    <td><div className="ha-chips">{u.roles.map((r) => <Badge key={r} plain>{roleLabel(r)}</Badge>)}</div></td>
                    <td className="ha-right">
                      {isCustomer(u) ? (
                        <button type="button" className="ha-btn is-sm is-primary" onClick={() => { setTarget(u); setReason(""); setFormError(null); }}>
                          Request support view
                        </button>
                      ) : (
                        <span className="ha-sub">Staff account</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Your support views">
        {sessions.loading && !sessions.data && <LoadingRows rows={3} />}
        {sessions.error && <ErrorNotice message={sessions.error} />}
        {sessions.data && sessions.data.data.length === 0 && <EmptyState icon="icon-carus-usercheck" title="No requests yet" />}
        {sessions.data && sessions.data.data.length > 0 && (
          <div className="ha-table-wrap">
            <table className="ha-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th className="ha-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.data.data.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="ha-primary-text">{s.customer?.name ?? "—"}</div>
                      <div className="ha-sub">{s.customer?.email}</div>
                    </td>
                    <td style={{ maxWidth: 320 }}>
                      {s.reason}
                      <div className="ha-sub">Requested {formatWhen(s.requested_at)}</div>
                    </td>
                    <td>
                      <Badge tone={STATUS_TONE[s.status] ?? "neutral"}>{s.status === "requested" ? "waiting for customer" : s.status}</Badge>
                    </td>
                    <td className="ha-right">
                      {s.status === "approved" && (
                        <button type="button" className="ha-btn is-sm is-primary" onClick={() => openView(s)}>
                          Open read-only view
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={target !== null} onClose={() => !busy && setTarget(null)} title="Request support view" description={target ? `${target.name} (${target.email}) will be asked to allow it.` : undefined}>
        <form onSubmit={request}>
          <div className="ha-field">
            <label htmlFor="sv-reason">Why you need to see their account</label>
            <textarea id="sv-reason" className="ha-textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Shown to the customer — e.g. They can't find their order confirmation." maxLength={1000} />
            <div className="ha-hint">At least 10 characters.</div>
          </div>
          {formError && <div className="ha-alert is-danger">{formError}</div>}
          <div className="ha-modal-foot" style={{ padding: "4px 0 0" }}>
            <button type="button" className="ha-btn" onClick={() => setTarget(null)} disabled={busy}>Cancel</button>
            <button type="submit" className="ha-btn is-primary" disabled={busy || reason.trim().length < 10}>{busy ? "Sending..." : "Send request"}</button>
          </div>
        </form>
      </Modal>
    </SuperAdminShell>
  );
}
