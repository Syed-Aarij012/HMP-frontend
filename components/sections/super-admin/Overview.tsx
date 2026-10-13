"use client";

import Link from "next/link";
import { useState } from "react";
import SuperAdminShell from "./SuperAdminShell";
import { Card, ErrorNotice, LoadingRows, StatCard, Badge } from "@/components/admin/ui";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import { useDashboardOverview, type RangeSelection } from "@/hooks/useDashboardOverview";
import { OverviewBody, greeting, periodSummary } from "@/components/dashboard/overview/RoleDashboard";
import { RangeSelector } from "@/components/dashboard/overview/widgets";
import { useAuth } from "@/contexts/AuthContext";
import { actionLabel, formatWhen, type AdminActionRequest, type Paginated, type SuperAdminOverview } from "@/lib/superAdmin";

/**
 * §2.2 P7 — the Super Admin's home: the platform dashboard (trends, what needs attention,
 * activity — GET /dashboard/overview) plus the console's own controls and the four-eyes queue.
 * This is the only Super Admin dashboard; /dashboard redirects here.
 */
export default function Overview() {
  const { user } = useAuth();
  const [selection, setSelection] = useState<RangeSelection>({ key: "30d" });
  const dashboard = useDashboardOverview(selection);
  const { data, loading, error } = useAdminResource<{ data: SuperAdminOverview }>("/admin/overview");
  const pending = useAdminResource<Paginated<AdminActionRequest>>("/admin/action-requests?status=pending");
  const o = data?.data;
  const forMe = (pending.data?.data ?? []).filter((request) => request.can_decide).slice(0, 5);

  const consolePanel = (
    <div className="ov-charts">
      <Card title="Console" description="Controls only Super Admins have.">
        {loading && !o && <LoadingRows rows={3} />}
        {error && <ErrorNotice message={error} />}
        {o && (
          <div className="ha-card-body">
            <div className="ha-stats mb-0" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <StatCard label="Organisations" icon="icon-carus-usercheck" value={o.organizations.total.toLocaleString("en-GB")} note={`${o.organizations.suspended} suspended`} href="/admin/organizations" />
              <StatCard label="Live listings" icon="icon-carus-car" value={o.listings.live.toLocaleString("en-GB")} note={`${o.listings.taken_down} taken down`} href="/admin/listings" />
              <StatCard label="Feature flags on" icon="icon-carus-power" value={`${o.feature_flags.enabled} / ${o.feature_flags.total}`} href="/admin/feature-flags" />
              <StatCard label="Your break-glass" icon="icon-carus-clock" value={o.my_active_elevations} note="active grants" href="/admin/break-glass" attention={o.my_active_elevations > 0} />
            </div>
            <p className="ha-sub mt-3 mb-0">
              {o.users.frozen} frozen account{o.users.frozen === 1 ? "" : "s"} · {o.users.super_admins} active Super Admins · {o.pending_approvals} four-eyes request{o.pending_approvals === 1 ? "" : "s"} pending in total
            </p>
          </div>
        )}
      </Card>

      <Card title="Needs your decision" description="Four-eyes requests raised by another Super Admin." actions={<Link href="/admin/approvals" className="ha-btn is-sm">View all</Link>}>
        {pending.loading && !pending.data && <LoadingRows rows={3} />}
          {pending.data && forMe.length === 0 && (
            <div className="ha-empty">
              <i className="icon-carus-checkcircle" aria-hidden="true" />
              <b>You&apos;re all caught up</b>
              Nothing is waiting for your approval.
            </div>
          )}
          {forMe.length > 0 && (
            <div className="ha-table-wrap">
              <table className="ha-table"><caption className="ha-visually-hidden">Four-eyes requests waiting for your decision</caption>
                <tbody>
                  {forMe.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <div className="ha-primary-text">{actionLabel(request.action)}</div>
                        <div className="ha-sub">{request.target_label ?? `${request.target_kind} #${request.target_id}`}</div>
                      </td>
                      <td className="ha-sub">
                        by {request.requested_by?.name ?? "-"} · {formatWhen(request.created_at)}
                      </td>
                      <td>
                        <Badge tone="primary" plain>{request.ticket_reference}</Badge>
                      </td>
                      <td className="ha-right">
                        <Link href="/admin/approvals" className="ha-btn is-sm is-primary">Review</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
    </div>
  );

  return (
    <SuperAdminShell
      title={`${greeting()}${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
      intro={periodSummary(dashboard.data) ?? "Platform operations at a glance."}
      actions={<RangeSelector value={selection} onChange={setSelection} range={dashboard.data?.range ?? null} />}
    >
      <OverviewBody state={dashboard} showQuickActions={false} extra={consolePanel} />
    </SuperAdminShell>
  );
}
