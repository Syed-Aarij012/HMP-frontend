"use client";

import { useState, type FormEvent } from "react";
import SuperAdminShell from "./SuperAdminShell";
import { Badge, Card, EmptyState, ErrorNotice, LoadingRows, Modal, Pager, SearchInput, Tabs, useDebouncedValue, useToast } from "@/components/admin/ui";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { pageInfo, roleLabel, type AdminUser, type Paginated } from "@/lib/superAdmin";

const VIEWS = ["all", "active", "banned"] as const;

/**
 * SRS §2.2 Trust & Safety Analyst — "ban management". Marketplace accounts only (buyers,
 * sellers, trade buyers, dealer staff); a ban signs the account out and blocks login.
 */
export default function Bans() {
  const { notify } = useToast();
  const [q, setQ] = useState("");
  const search = useDebouncedValue(q.trim());
  const [view, setView] = useState<(typeof VIEWS)[number]>("all");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<{ user: AdminUser; action: "ban" | "unban" } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const qs = new URLSearchParams({ page: String(page) });
  if (search) qs.set("q", search);
  if (view !== "all") qs.set("status", view);
  const { data, loading, error, reload } = useAdminResource<Paginated<AdminUser>>(`/moderation/users?${qs.toString()}`);
  const info = data ? pageInfo(data) : null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!target) return;
    setBusy(true);
    setFormError(null);
    try {
      await apiFetch(`/moderation/users/${target.user.id}/${target.action}`, { method: "POST", body: { reason: reason.trim() } });
      notify(target.action === "ban" ? `${target.user.name} is banned.` : `${target.user.name} is unbanned.`);
      setTarget(null);
      setReason("");
      reload();
    } catch (err) {
      setFormError(describeApiError(err, "Could not save that."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SuperAdminShell title="Bans" intro="Ban marketplace accounts that break the rules, and lift bans on appeal. Every ban and unban needs a reason and is audited. Staff accounts are managed by Super Admins.">
      <Card>
        <div className="ha-toolbar">
          <Tabs label="Status" value={view} options={VIEWS} onChange={(next) => { setView(next); setPage(1); }} />
          <SearchInput label="Search accounts" placeholder="Name or email" value={q} onChange={(v) => { setQ(v); setPage(1); }} />
        </div>
        {loading && !data && <LoadingRows />}
        {error && <ErrorNotice message={error} />}
        {data && data.data.length === 0 && <EmptyState icon="icon-carus-shieldcheck" title="No accounts match" />}
        {data && data.data.length > 0 && (
          <div className="ha-table-wrap">
            <table className="ha-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="ha-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="ha-primary-text">{u.name}</div>
                      <div className="ha-sub">{u.email}</div>
                    </td>
                    <td><div className="ha-chips">{u.roles.map((r) => <Badge key={r} plain>{roleLabel(r)}</Badge>)}</div></td>
                    <td><Badge tone={u.status === "active" ? "success" : "danger"}>{u.status === "suspended" ? "frozen" : u.status}</Badge></td>
                    <td className="ha-right">
                      {u.status === "banned" ? (
                        <button type="button" className="ha-btn is-sm" onClick={() => { setTarget({ user: u, action: "unban" }); setReason(""); setFormError(null); }}>Unban</button>
                      ) : u.status === "active" ? (
                        <button type="button" className="ha-btn is-sm is-danger" onClick={() => { setTarget({ user: u, action: "ban" }); setReason(""); setFormError(null); }}>Ban</button>
                      ) : (
                        <span className="ha-sub">Frozen by a Super Admin</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {info && <Pager page={info.page} lastPage={info.lastPage} total={info.total} onChange={setPage} />}
      </Card>

      <Modal
        open={target !== null}
        onClose={() => !busy && setTarget(null)}
        title={target?.action === "ban" ? "Ban account" : "Lift ban"}
        description={target ? `${target.user.name} (${target.user.email})${target.action === "ban" ? " will be signed out and unable to log in." : ""}` : undefined}
      >
        <form onSubmit={submit}>
          <div className="ha-field">
            <label htmlFor="ban-reason">Reason</label>
            <textarea id="ban-reason" className="ha-textarea" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} />
            <div className="ha-hint">At least 10 characters — recorded in the audit log.</div>
          </div>
          {formError && <div className="ha-alert is-danger">{formError}</div>}
          <div className="ha-modal-foot" style={{ padding: "4px 0 0" }}>
            <button type="button" className="ha-btn" onClick={() => setTarget(null)} disabled={busy}>Cancel</button>
            <button type="submit" className={`ha-btn ${target?.action === "ban" ? "is-danger-solid" : "is-primary"}`} disabled={busy || reason.trim().length < 10}>
              {busy ? "Saving..." : target?.action === "ban" ? "Ban" : "Lift ban"}
            </button>
          </div>
        </form>
      </Modal>
    </SuperAdminShell>
  );
}
