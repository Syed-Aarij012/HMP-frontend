"use client";

import { useState } from "react";
import SuperAdminShell from "./SuperAdminShell";
import JustifiedAction from "./JustifiedAction";
import { Badge, Card, EmptyState, ErrorNotice, LoadingRows, Pager, SearchInput, useDebouncedValue } from "@/components/admin/ui";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import { pageInfo, type AdminOrganization, type Paginated } from "@/lib/superAdmin";

/**
 * §2.2 P7 "tenant/org management". Suspending an organization (four-eyes) signs its staff out
 * and stops them logging in; reactivating lifts that.
 */
export default function Organizations() {
  const [q, setQ] = useState("");
  const search = useDebouncedValue(q.trim());
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const qs = new URLSearchParams({ page: String(page) });
  if (search) qs.set("q", search);
  if (status) qs.set("status", status);
  const { data, loading, error, reload } = useAdminResource<Paginated<AdminOrganization>>(`/admin/organizations?${qs.toString()}`);
  const info = data ? pageInfo(data) : null;

  return (
    <SuperAdminShell title="Organizations" intro="Every dealer group on the platform. Suspending one signs all its staff out and blocks their logins until it's reactivated.">
      <Card>
        <div className="ha-toolbar">
          <SearchInput label="Search organizations" placeholder="Search by name" value={q} onChange={(v) => { setQ(v); setPage(1); }} />
          <select className="ha-select" aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        {loading && !data && <LoadingRows />}
        {error && <ErrorNotice message={error} />}
        {data && data.data.length === 0 && <EmptyState icon="icon-carus-usercheck" title="No organizations match" />}
        {data && data.data.length > 0 && (
          <div className="ha-table-wrap">
            <table className="ha-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>KYB</th>
                  <th>Staff</th>
                  <th>Listings</th>
                  <th>Status</th>
                  <th className="ha-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <div className="ha-primary-text">{org.name}</div>
                      <div className="ha-sub">
                        {org.type === "platform" ? "Platform" : "Dealer group"}
                        {org.companies_house_number ? ` · CH ${org.companies_house_number}` : ""}
                      </div>
                    </td>
                    <td>
                      <Badge tone={org.kyb_status === "verified" ? "success" : org.kyb_status === "rejected" ? "danger" : "warning"}>{org.kyb_status}</Badge>
                    </td>
                    <td>{org.users_count}</td>
                    <td>{org.listings_count}</td>
                    <td>
                      <Badge tone={org.status === "active" ? "success" : "danger"}>{org.status}</Badge>
                    </td>
                    <td>
                      <div className="ha-actions">
                        {org.type === "platform" ? (
                          <span className="ha-sub">Platform organization</span>
                        ) : org.status === "active" ? (
                          <JustifiedAction label="Suspend" title="Suspend organization" description={`${org.name} — all ${org.users_count} staff will be signed out.`} path={`/admin/organizations/${org.id}/suspend`} fourEyes danger onDone={reload} />
                        ) : (
                          <JustifiedAction label="Reactivate" title="Reactivate organization" description={org.name} path={`/admin/organizations/${org.id}/reactivate`} primary onDone={reload} />
                        )}
                      </div>
                    </td>
                  </tr>
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
