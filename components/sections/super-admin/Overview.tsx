"use client";

import Link from "next/link";
import SuperAdminShell from "./SuperAdminShell";
import { Card, ErrorNotice, LoadingRows, StatCard, Badge } from "@/components/admin/ui";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import { actionLabel, formatWhen, type AdminActionRequest, type Paginated, type SuperAdminOverview } from "@/lib/superAdmin";

/** §2.2 P7 — the Admin Panel's landing page. */
export default function Overview() {
  const { data, loading, error } = useAdminResource<{ data: SuperAdminOverview }>("/admin/overview");
  const pending = useAdminResource<Paginated<AdminActionRequest>>("/admin/action-requests?status=pending");
  const o = data?.data;
  const forMe = (pending.data?.data ?? []).filter((request) => request.can_decide).slice(0, 5);

  return (
    <SuperAdminShell
      title="Overview"
      intro="Platform operations at a glance. Destructive actions need a second Super Admin's approval, every action needs a reason and a ticket, and everything is written to the audit log."
    >
      {loading && !o && <Card><LoadingRows /></Card>}
      {error && <Card><ErrorNotice message={error} /></Card>}

      {o && (
        <div className="ha-stats">
          <StatCard
            label="Waiting for your approval"
            icon="icon-carus-checkcircle"
            value={o.awaiting_my_approval}
            note={`${o.pending_approvals} pending in total`}
            href="/admin/approvals"
            attention={o.awaiting_my_approval > 0}
          />
          <StatCard
            label="Listings awaiting review"
            icon="icon-carus-pending"
            value={o.listings.awaiting_review}
            note="Submitted by sellers"
            href="/admin/review"
            attention={o.listings.awaiting_review > 0}
          />
          <StatCard label="Accounts" icon="icon-carus-profile" value={o.users.total.toLocaleString("en-GB")} note={`${o.users.frozen} frozen · ${o.users.super_admins} active Super Admins`} href="/admin/users" />
          <StatCard label="Organizations" icon="icon-carus-usercheck" value={o.organizations.total.toLocaleString("en-GB")} note={`${o.organizations.suspended} suspended`} href="/admin/organizations" />
          <StatCard label="Live listings" icon="icon-carus-car" value={o.listings.live.toLocaleString("en-GB")} note={`${o.listings.taken_down} taken down`} href="/admin/listings" />
          <StatCard label="Feature flags on" icon="icon-carus-power" value={`${o.feature_flags.enabled} / ${o.feature_flags.total}`} href="/admin/feature-flags" />
          <StatCard label="Your break-glass grants" icon="icon-carus-clock" value={o.my_active_elevations} note="active right now" href="/admin/break-glass" attention={o.my_active_elevations > 0} />
        </div>
      )}

      <Card title="Needs your decision" actions={<Link href="/admin/approvals" className="ha-btn is-sm">View all</Link>}>
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
            <table className="ha-table">
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
    </SuperAdminShell>
  );
}
