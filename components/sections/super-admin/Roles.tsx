"use client";

import { useState } from "react";
import SuperAdminShell from "./SuperAdminShell";
import JustifiedAction from "./JustifiedAction";
import { Badge, Card, ErrorNotice, LoadingRows, SearchInput } from "@/components/admin/ui";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import type { RoleMatrixResponse, RoleMatrixRow } from "@/lib/superAdmin";

function PermissionSelect({ options, value, onChange, label }: { options: string[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="ha-field">
      <label htmlFor={`perm-${label}`}>{label}</label>
      <select id={`perm-${label}`} className="ha-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choose a permission...</option>
        {options.map((permission) => <option key={permission} value={permission}>{permission}</option>)}
      </select>
    </div>
  );
}

function RoleRow({ role, allPermissions, onDone }: { role: RoleMatrixRow; allPermissions: string[]; onDone: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [grant, setGrant] = useState("");
  const [revoke, setRevoke] = useState("");
  const grantable = allPermissions.filter((p) => !role.permissions.includes(p));
  const shown = expanded ? role.permissions : role.permissions.slice(0, 6);
  const drift = role.added_since_baseline.length + role.removed_since_baseline.length;

  return (
    <tr>
      <td style={{ minWidth: 200 }}>
        <div className="ha-primary-text">{role.label}</div>
        <div className="ha-sub"><code>{role.name}</code></div>
        <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
          <Badge plain tone={role.scope === "organization" ? "primary" : "neutral"}>{role.scope === "organization" ? "Dealership" : "Platform"}</Badge>
          <Badge plain>{role.users_count} account{role.users_count === 1 ? "" : "s"}</Badge>
          {drift > 0 && <Badge plain tone="warning" title="Differs from the baseline policy">Changed</Badge>}
        </div>
      </td>
      <td>
        <div className="ha-chips">
          {shown.map((permission) => (
            <span key={permission} className={`ha-tag${role.added_since_baseline.includes(permission) ? " is-added" : ""}`} title={role.added_since_baseline.includes(permission) ? "Added since the baseline policy" : undefined}>
              {permission}
            </span>
          ))}
          {role.permissions.length > 6 && (
            <button type="button" className="ha-btn is-ghost is-sm" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Show less" : `+${role.permissions.length - 6} more`}
            </button>
          )}
        </div>
        {role.removed_since_baseline.length > 0 && (
          <div className="ha-sub" style={{ color: "var(--ha-danger)", marginTop: 6 }}>Removed since baseline: {role.removed_since_baseline.join(", ")}</div>
        )}
      </td>
      <td>
        <div className="ha-actions">
          <JustifiedAction
            label="Grant"
            title={`Grant a permission to ${role.label}`}
            path={`/admin/roles/${role.name}/permissions`}
            extra={{ permission: grant }}
            fourEyes
            disabled={grantable.length === 0}
            canSubmit={grant !== ""}
            extraFields={<PermissionSelect options={grantable} value={grant} onChange={setGrant} label="Permission" />}
            onDone={() => { setGrant(""); onDone(); }}
          />
          <JustifiedAction
            label="Revoke"
            title={`Revoke a permission from ${role.label}`}
            path={`/admin/roles/${role.name}/permissions/revoke`}
            extra={{ permission: revoke }}
            fourEyes
            danger
            disabled={role.permissions.length === 0}
            canSubmit={revoke !== ""}
            extraFields={<PermissionSelect options={role.permissions} value={revoke} onChange={setRevoke} label="Permission" />}
            onDone={() => { setRevoke(""); onDone(); }}
          />
        </div>
      </td>
    </tr>
  );
}

/**
 * §2.2 P7 "role & policy administration": the live role → permission matrix, how it differs
 * from the baseline policy (config/rbac.php), and four-eyes grant/revoke of a permission.
 */
export default function Roles() {
  const { data, loading, error, reload } = useAdminResource<RoleMatrixResponse>("/admin/roles");
  const [filter, setFilter] = useState("");
  const term = filter.trim().toLowerCase();
  const rows = (data?.data ?? []).filter(
    (role) => !term || role.name.includes(term) || role.label.toLowerCase().includes(term) || role.permissions.some((p) => p.includes(term)),
  );

  return (
    <SuperAdminShell
      title="Role matrix"
      intro={<>What each role can do{data ? <> — baseline policy <code>{data.policy_version}</code></> : null}. Highlighted permissions were added after the baseline. Changes need a second Super Admin&apos;s approval; give roles to people from Users &amp; roles.</>}
    >
      <Card>
        <div className="ha-toolbar">
          <SearchInput label="Filter roles" placeholder="Filter by role or permission" value={filter} onChange={setFilter} />
        </div>
        {loading && !data && <LoadingRows />}
        {error && <ErrorNotice message={error} />}
        {data && (
          <div className="ha-table-wrap">
            <table className="ha-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Permissions</th>
                  <th className="ha-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((role) => <RoleRow key={role.name} role={role} allPermissions={data.permissions} onDone={reload} />)}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </SuperAdminShell>
  );
}
