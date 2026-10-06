"use client";

import { useState } from "react";
import SuperAdminShell from "./SuperAdminShell";
import JustifiedAction from "./JustifiedAction";
import { Badge, Card, EmptyState, ErrorNotice, LoadingRows, Pager, SearchInput, initials, useDebouncedValue } from "@/components/admin/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import { pageInfo, roleLabel, type AdminUser, type Paginated, type RoleMatrixResponse } from "@/lib/superAdmin";

function RoleSelect({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
  return (
    <div className="ha-field">
      <label htmlFor={`role-${label}`}>{label}</label>
      <select id={`role-${label}`} className="ha-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choose a role...</option>
        {options.map((role) => (
          <option key={role} value={role}>{roleLabel(role)}</option>
        ))}
      </select>
    </div>
  );
}

function UserActions({ user, allRoles, onDone }: { user: AdminUser; allRoles: string[]; onDone: () => void }) {
  const [grant, setGrant] = useState("");
  const [revoke, setRevoke] = useState("");
  const grantable = allRoles.filter((role) => !user.roles.includes(role));
  const who = `${user.name} (${user.email})`;

  return (
    <div className="ha-actions">
      <JustifiedAction
        label="Assign role"
        title="Assign a role"
        description={who}
        path={`/admin/users/${user.id}/roles`}
        extra={{ role: grant }}
        fourEyes
        disabled={grantable.length === 0}
        canSubmit={grant !== ""}
        extraFields={<RoleSelect value={grant} onChange={setGrant} options={grantable} label="Role to assign" />}
        onDone={() => { setGrant(""); onDone(); }}
      />
      <JustifiedAction
        label="Revoke role"
        title="Revoke a role"
        description={who}
        path={`/admin/users/${user.id}/roles/revoke`}
        extra={{ role: revoke }}
        fourEyes
        disabled={user.roles.length === 0}
        canSubmit={revoke !== ""}
        extraFields={<RoleSelect value={revoke} onChange={setRevoke} options={user.roles} label="Role to revoke" />}
        onDone={() => { setRevoke(""); onDone(); }}
      />
      {user.status === "active" ? (
        <JustifiedAction
          label="Freeze"
          title="Freeze account"
          description={`${who} will be signed out everywhere and unable to log in.`}
          path={`/admin/users/${user.id}/freeze`}
          fourEyes
          danger
          onDone={onDone}
        />
      ) : (
        <JustifiedAction label="Unfreeze" title="Unfreeze account" description={who} path={`/admin/users/${user.id}/unfreeze`} primary onDone={onDone} />
      )}
    </div>
  );
}

/**
 * §2.2 P7: account sanctions (freeze) and role administration across every account. Freezing and
 * role changes are four-eyes; a Super Admin can never act on their own account.
 */
export default function Users() {
  const { user: me } = useAuth();
  const [q, setQ] = useState("");
  const search = useDebouncedValue(q.trim());
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const qs = new URLSearchParams({ page: String(page) });
  if (search) qs.set("q", search);
  if (role) qs.set("role", role);
  if (status) qs.set("status", status);

  const { data, loading, error, reload } = useAdminResource<Paginated<AdminUser>>(`/admin/users?${qs.toString()}`);
  const roles = useAdminResource<RoleMatrixResponse>("/admin/roles");
  const allRoles = roles.data?.data.map((r) => r.name) ?? [];
  const info = data ? pageInfo(data) : null;

  return (
    <SuperAdminShell title="Users & roles" intro="Find any account, freeze or unfreeze it, and assign or revoke roles. Changes to roles and freezes go through four-eyes approval.">
      <Card>
        <div className="ha-toolbar">
          <SearchInput label="Search users" placeholder="Search name or email" value={q} onChange={(v) => { setQ(v); setPage(1); }} />
          <select className="ha-select" aria-label="Filter by role" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">All roles</option>
            {allRoles.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </select>
          <select className="ha-select" aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Frozen</option>
            <option value="banned">Banned</option>
          </select>
        </div>
        {loading && !data && <LoadingRows />}
        {error && <ErrorNotice message={error} />}
        {data && data.data.length === 0 && <EmptyState icon="icon-carus-profile" title="No accounts match" text="Try a different search or filter." />}
        {data && data.data.length > 0 && (
          <div className="ha-table-wrap">
            <table className="ha-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Roles</th>
                  <th>Organization</th>
                  <th>Status</th>
                  <th className="ha-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="ha-avatar" aria-hidden="true">{initials(u.name)}</div>
                        <div>
                          <div className="ha-primary-text">{u.name} {u.id === me?.id && <Badge plain tone="primary">You</Badge>}</div>
                          <div className="ha-sub">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="ha-chips">
                        {u.roles.length === 0 && <span className="ha-sub">No roles</span>}
                        {u.roles.map((r) => (
                          <Badge key={r} plain tone={r === "super_admin" ? "dark" : "neutral"}>{roleLabel(r)}</Badge>
                        ))}
                      </div>
                    </td>
                    <td>
                      {u.organization ? (
                        <>
                          <div>{u.organization.name}</div>
                          {u.organization.status === "suspended" && <div className="ha-sub" style={{ color: "var(--ha-danger)" }}>Organization suspended</div>}
                        </>
                      ) : (
                        <span className="ha-sub">—</span>
                      )}
                    </td>
                    <td>
                      <Badge tone={u.status === "active" ? "success" : "danger"}>{u.status === "suspended" ? "frozen" : u.status}</Badge>
                      <div className="ha-sub" style={{ marginTop: 4 }}>MFA {u.mfa_enabled ? "on" : "off"}</div>
                    </td>
                    <td>
                      {u.id === me?.id ? (
                        <div className="ha-sub ha-right">Another Super Admin manages your account</div>
                      ) : (
                        <UserActions user={u} allRoles={allRoles} onDone={reload} />
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
    </SuperAdminShell>
  );
}
