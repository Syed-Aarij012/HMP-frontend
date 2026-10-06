"use client";

import { Fragment, useState } from "react";
import SuperAdminShell from "./SuperAdminShell";
import { Badge, Card, EmptyState, ErrorNotice, LoadingRows, Pager, SearchInput, Tabs, useDebouncedValue, type Tone } from "@/components/admin/ui";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import { formatWhen, pageInfo, type AuditLogRow, type Paginated } from "@/lib/superAdmin";

const DECISIONS = ["any", "allow", "deny", "pending"] as const;
const DECISION_TONE: Record<string, Tone> = { allow: "success", deny: "danger", pending: "warning", blocked: "danger" };

/** REQ RBAC-004: the immutable audit trail — read-only. */
export default function AuditLog() {
  const [action, setAction] = useState("");
  const prefix = useDebouncedValue(action.trim());
  const [decision, setDecision] = useState<(typeof DECISIONS)[number]>("any");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<number | null>(null);

  const qs = new URLSearchParams({ page: String(page) });
  if (prefix) qs.set("action", prefix);
  if (decision !== "any") qs.set("decision", decision);
  const { data, loading, error } = useAdminResource<Paginated<AuditLogRow>>(`/admin/audit-logs?${qs.toString()}`);
  const info = data ? pageInfo(data) : null;

  return (
    <SuperAdminShell title="Audit log" intro="Append-only record of privileged actions and refused attempts, kept for at least seven years. Entries can't be edited or deleted.">
      <Card>
        <div className="ha-toolbar">
          <SearchInput label="Action prefix" placeholder="Action starts with… e.g. super_admin." value={action} onChange={(v) => { setAction(v); setPage(1); }} />
          <Tabs label="Decision" value={decision} options={DECISIONS} onChange={(next) => { setDecision(next); setPage(1); }} />
        </div>
        {loading && !data && <LoadingRows />}
        {error && <ErrorNotice message={error} />}
        {data && data.data.length === 0 && <EmptyState icon="icon-carus-listings" title="No entries" />}
        {data && data.data.length > 0 && (
          <div className="ha-table-wrap">
            <table className="ha-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Decision</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <Fragment key={row.id}>
                    <tr>
                      <td className="ha-sub" style={{ whiteSpace: "nowrap" }}>{formatWhen(row.created_at)}</td>
                      <td>
                        <div>{row.actor?.name ?? "System"}</div>
                        <div className="ha-sub">{row.actor_role?.replace(/_/g, " ") ?? ""}</div>
                      </td>
                      <td><code>{row.action}</code></td>
                      <td className="ha-sub">
                        {row.resource_type.split("\\").pop()}
                        {row.resource_id !== null ? ` #${row.resource_id}` : ""}
                      </td>
                      <td>{row.decision && <Badge tone={DECISION_TONE[row.decision] ?? "neutral"}>{row.decision}</Badge>}</td>
                      <td className="ha-right">
                        <button type="button" className="ha-btn is-ghost is-sm" onClick={() => setOpen(open === row.id ? null : row.id)} aria-expanded={open === row.id}>
                          {open === row.id ? "Hide" : "Details"}
                        </button>
                      </td>
                    </tr>
                    {open === row.id && (
                      <tr>
                        <td colSpan={6} style={{ background: "var(--ha-surface-2)" }}>
                          <div className="ha-sub" style={{ marginBottom: 6 }}>
                            Policy {row.policy_version ?? "—"} · IP {row.ip_address ?? "—"}
                          </div>
                          <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(row.metadata ?? {}, null, 2)}</pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {info && <Pager page={info.page} lastPage={info.lastPage} total={info.total} onChange={setPage} />}
      </Card>
    </SuperAdminShell>
  );
}
