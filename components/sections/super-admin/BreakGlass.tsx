"use client";

import { useState, type FormEvent } from "react";
import SuperAdminShell from "./SuperAdminShell";
import { Badge, Card, EmptyState, ErrorNotice, LoadingRows, useToast } from "@/components/admin/ui";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { formatWhen, TICKET_PATTERN, type PrivilegeElevation } from "@/lib/superAdmin";

type ElevationsResponse = { data: PrivilegeElevation[]; scopes: Record<string, string>; max_minutes: number };

/**
 * REQ RBAC-005: Just-In-Time break-glass elevation — reason and ticket captured, time-boxed, and
 * revocable. §2.3: a Super Admin may hammer or withdraw a lot only while one of these is live.
 */
export default function BreakGlass() {
  const { notify } = useToast();
  const { data, loading, error, reload } = useAdminResource<ElevationsResponse>("/admin/elevations");
  const [scope, setScope] = useState("");
  const [minutes, setMinutes] = useState("15");
  const [reason, setReason] = useState("");
  const [ticket, setTicket] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const scopes = data?.scopes ?? {};
  const maxMinutes = data?.max_minutes ?? 60;
  const active = (data?.data ?? []).filter((e) => e.active);
  const valid = scope !== "" && reason.trim().length >= 10 && TICKET_PATTERN.test(ticket) && Number(minutes) >= 1 && Number(minutes) <= maxMinutes;

  async function grant(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await apiFetch("/admin/elevations", {
        method: "POST",
        body: { scope, minutes: Number(minutes), reason: reason.trim(), ticket_reference: ticket.trim() },
      });
      notify(`Break-glass active for ${minutes} minutes.`);
      setReason("");
      setTicket("");
      reload();
    } catch (err) {
      setFormError(describeApiError(err, "Could not start the elevation."));
    } finally {
      setBusy(false);
    }
  }

  async function end(id: number) {
    try {
      await apiFetch(`/admin/elevations/${id}/revoke`, { method: "POST" });
      notify("Elevation ended.");
      reload();
    } catch (err) {
      notify(describeApiError(err, "Could not end the elevation."), { error: true });
    }
  }

  return (
    <SuperAdminShell
      title="Break-glass"
      intro="Super Admins hold no standing right to hammer or withdraw a lot. Start a short, ticketed elevation when an emergency needs it — it ends by itself."
    >
      {active.length > 0 && (
        <div className="ha-alert is-warning">
          <b>You have {active.length} active elevation{active.length > 1 ? "s" : ""}.</b> End {active.length > 1 ? "them" : "it"} as soon as the emergency is over.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, alignItems: "start" }}>
        <Card title="Start an elevation">
          <form onSubmit={grant} className="ha-card-body">
            <div className="ha-field">
              <label htmlFor="bg-scope">What it&apos;s for</label>
              <select id="bg-scope" className="ha-select" value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="">Choose...</option>
                {Object.entries(scopes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div className="ha-field">
              <label htmlFor="bg-minutes">Duration (minutes)</label>
              <input id="bg-minutes" type="number" min={1} max={maxMinutes} className="ha-input" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
              <div className="ha-hint">Up to {maxMinutes} minutes.</div>
            </div>
            <div className="ha-field">
              <label htmlFor="bg-reason">Reason</label>
              <textarea id="bg-reason" className="ha-textarea" placeholder="At least 10 characters" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="ha-field">
              <label htmlFor="bg-ticket">Ticket reference</label>
              <input id="bg-ticket" className="ha-input" placeholder="e.g. INC-42" value={ticket} onChange={(e) => setTicket(e.target.value.toUpperCase())} />
              {ticket !== "" && !TICKET_PATTERN.test(ticket) && <div className="ha-error-text">Use a ticket reference like INC-42.</div>}
            </div>
            {formError && <div className="ha-alert is-danger" role="alert">{formError}</div>}
            <button type="submit" className="ha-btn is-danger-solid is-block" disabled={busy || !valid}>
              {busy ? "Starting..." : "Start elevation"}
            </button>
          </form>
        </Card>

        <Card title="Your recent elevations">
          {loading && !data && <LoadingRows rows={3} />}
          {error && <ErrorNotice message={error} />}
          {data && data.data.length === 0 && <EmptyState icon="icon-carus-clock" title="None yet" />}
          {data && data.data.length > 0 && (
            <div className="ha-table-wrap">
              <table className="ha-table">
                <tbody>
                  {data.data.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <code>{e.scope}</code>
                        <div className="ha-sub" style={{ marginTop: 4 }}>{e.reason} · {e.ticket_reference}</div>
                      </td>
                      <td>
                        {e.active ? (
                          <Badge tone="warning">Active until {formatWhen(e.expires_at)}</Badge>
                        ) : (
                          <span className="ha-sub">{e.revoked_at ? `Ended ${formatWhen(e.revoked_at)}` : `Expired ${formatWhen(e.expires_at)}`}</span>
                        )}
                      </td>
                      <td className="ha-right">
                        {e.active && <button type="button" className="ha-btn is-sm" onClick={() => end(e.id)}>End now</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </SuperAdminShell>
  );
}
