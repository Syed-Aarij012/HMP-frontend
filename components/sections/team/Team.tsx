"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useOrganizationTeam,
  type NewStaff,
  type TeamMember,
  type TeamRole,
  type TeamRooftop,
} from "@/hooks/useOrganizationTeam";
import DashboardPage from "@/components/dashboard/DashboardPage";
import {
  Badge,
  Card,
  DataTable,
  DataToolbar,
  EmptyState,
  LoadingTable,
  NoMatches,
  Notice,
  StatusBadge,
  formatMoney,
  useListControls,
} from "@/components/ui/kit";

function RoleChecks({ roles, value, onChange, disabled }: { roles: TeamRole[]; value: string[]; onChange: (next: string[]) => void; disabled?: boolean }) {
  return (
    <div className="ha-check-list">
      {roles.map((role) => (
        <label key={role.name} className="ha-check" title={role.permissions.join(", ")} style={{ cursor: disabled ? "default" : "pointer" }}>
          <input
            type="checkbox"
            disabled={disabled}
            checked={value.includes(role.name)}
            onChange={(e) => onChange(e.target.checked ? [...value, role.name] : value.filter((r) => r !== role.name))}
          />
          {role.label}
        </label>
      ))}
    </div>
  );
}

const PERMISSION_LABELS: Record<string, string> = {
  "manage-org-listings": "Manage dealership ads",
  "manage-org-leads": "Work the whole lead inbox",
  "view-auction-catalog": "Browse the auction catalogue",
  "view-condition-report-trade": "See full condition reports",
  "consign-vehicle": "Consign stock into auctions",
  "appraise-part-exchange": "Appraise part-exchanges",
  "place-bid": "Bid at auction",
  "place-proxy-bid": "Place proxy bids",
};

/** §2.2 P3 delegated admin: extra permissions for one person, beyond what their roles give. */
function PermissionChecks({ options, roleGiven, value, onChange, disabled }: {
  options: string[];
  roleGiven: Set<string>;
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  if (options.length === 0) return null;
  return (
    <div className="ha-check-list">
      {options.map((permission) => {
        const fromRole = roleGiven.has(permission);
        return (
          <label key={permission} className="ha-check" style={{ cursor: disabled || fromRole ? "default" : "pointer" }}>
            <input
              type="checkbox"
              disabled={disabled || fromRole}
              checked={fromRole || value.includes(permission)}
              onChange={(e) => onChange(e.target.checked ? [...value, permission] : value.filter((p) => p !== permission))}
            />
            <span>
              {PERMISSION_LABELS[permission] ?? permission}
              {fromRole && <span className="ha-sub"> · from role</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/** REQ RBAC-003: roles held at one rooftop only — e.g. Sales Manager in Leeds, Sales Executive in York. */
function RooftopRolesEditor({ rooftops, roles, wideRoles, value, onChange, disabled }: {
  rooftops: TeamRooftop[];
  roles: TeamRole[];
  wideRoles: string[];
  value: Record<number, string[]>;
  onChange: (next: Record<number, string[]>) => void;
  disabled?: boolean;
}) {
  const bindable = roles.filter((r) => r.name !== "dealer_org_admin" && !wideRoles.includes(r.name));
  if (rooftops.length === 0 || bindable.length === 0) return <span className="ha-sub">No rooftops yet.</span>;

  return (
    <div className="ha-stack">
      {rooftops.map((rooftop) => (
        <fieldset key={rooftop.id} className="ha-field mb-0">
          <legend>{rooftop.name}</legend>
          <div className="ha-check-list is-inline">
            {bindable.map((role) => {
              const held = (value[rooftop.id] ?? []).includes(role.name);
              return (
                <label key={role.name} className="ha-check" style={{ cursor: disabled ? "default" : "pointer" }}>
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={held}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        [rooftop.id]: e.target.checked ? [...(value[rooftop.id] ?? []), role.name] : (value[rooftop.id] ?? []).filter((r) => r !== role.name),
                      })
                    }
                  />
                  {role.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

const toRooftopMap = (list: { rooftop_id: number; roles: string[] }[]) => Object.fromEntries(list.map((r) => [r.rooftop_id, r.roles])) as Record<number, string[]>;
const fromRooftopMap = (map: Record<number, string[]>) =>
  Object.entries(map)
    .filter(([, roles]) => roles.length > 0)
    .map(([rooftopId, roles]) => ({ rooftop_id: Number(rooftopId), roles }));

function StaffRow({ member, isSelf, roles, delegable, rooftops, onSave }: {
  member: TeamMember;
  isSelf: boolean;
  roles: TeamRole[];
  delegable: string[];
  rooftops: TeamRooftop[];
  onSave: (id: number, changes: Record<string, unknown>) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [memberRoles, setMemberRoles] = useState(member.roles);
  const [extra, setExtra] = useState(member.extra_permissions);
  const [rooftopRoles, setRooftopRoles] = useState<Record<number, string[]>>(toRooftopMap(member.rooftop_roles));
  const roleGiven = new Set(roles.filter((r) => memberRoles.includes(r.name)).flatMap((r) => r.permissions));
  const [rooftopId, setRooftopId] = useState<string>(member.rooftop ? String(member.rooftop.id) : "");
  const [limit, setLimit] = useState(member.spending_limit ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [open, setOpen] = useState(false);

  async function save(overrides: Record<string, unknown> = {}) {
    setBusy(true);
    setMessage(null);
    const changes: Record<string, unknown> = {
      rooftop_id: rooftopId === "" ? null : Number(rooftopId),
      spending_limit: limit === "" ? null : Number(limit),
      ...overrides,
    };
    if (!isSelf) {
      changes.roles = memberRoles;
      changes.permissions = extra.filter((p) => !roleGiven.has(p));
      changes.rooftop_roles = fromRooftopMap(rooftopRoles);
    }
    const result = await onSave(member.id, changes);
    setBusy(false);
    setMessage(result.ok ? { ok: true, text: "Saved." } : { ok: false, text: result.message ?? "Could not save." });
  }

  const roleLabels = roles.filter((r) => member.roles.includes(r.name)).map((r) => r.label);
  const active = member.status === "active";

  return (
    <>
      <tr>
        <td data-label="Person">
          <div className="ha-primary-text">
            {member.name} {isSelf && <Badge plain>You</Badge>}
          </div>
          <div className="ha-sub">{member.email}</div>
        </td>
        <td data-label="Roles">
          <div className="ha-chips">
            {roleLabels.length > 0 ? roleLabels.map((label) => <Badge key={label} plain>{label}</Badge>) : <span className="ha-sub">No roles</span>}
            {member.extra_permissions.length > 0 && (
              <Badge tone="primary" plain>
                +{member.extra_permissions.length} permission{member.extra_permissions.length === 1 ? "" : "s"}
              </Badge>
            )}
          </div>
        </td>
        <td data-label="Rooftop">{member.rooftop?.name ?? <span className="ha-muted">Whole dealership</span>}</td>
        <td data-label="Spending limit" className="is-num">
          {member.spending_limit ? formatMoney(Number(member.spending_limit)) : <span className="ha-muted">No limit</span>}
        </td>
        <td data-label="Status">
          <Badge tone={active ? "success" : "danger"}>{member.status === "suspended" ? "deactivated" : member.status}</Badge>
        </td>
        <td data-label="" className="ha-right">
          <button type="button" className="ha-btn is-sm" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? "Close" : "Edit"}
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6}>
            <div className="ha-inline-edit">
              <div className="ha-team-editor">
                <fieldset className="ha-field">
                  <legend>Roles</legend>
                  <RoleChecks roles={roles} value={memberRoles} onChange={setMemberRoles} disabled={isSelf} />
                  {isSelf && <div className="ha-hint">Another Org Admin changes your roles.</div>}
                </fieldset>
                {delegable.length > 0 && (
                  <fieldset className="ha-field">
                    <legend>Extra permissions</legend>
                    <PermissionChecks options={delegable} roleGiven={roleGiven} value={extra} onChange={setExtra} disabled={isSelf} />
                  </fieldset>
                )}
                <fieldset className="ha-field">
                  <legend>Rooftop roles</legend>
                  <RooftopRolesEditor rooftops={rooftops} roles={roles} wideRoles={memberRoles} value={rooftopRoles} onChange={setRooftopRoles} disabled={isSelf} />
                </fieldset>
                <div>
                  <div className="ha-field">
                    <label htmlFor={`rooftop-${member.id}`}>Home rooftop</label>
                    <select id={`rooftop-${member.id}`} className="ha-select" value={rooftopId} onChange={(e) => setRooftopId(e.target.value)}>
                      <option value="">No rooftop</option>
                      {rooftops.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="ha-field">
                    <label htmlFor={`limit-${member.id}`}>Spending limit (£)</label>
                    <input
                      id={`limit-${member.id}`}
                      type="number"
                      min={0}
                      step="0.01"
                      className="ha-input"
                      placeholder="No limit"
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              {message && <Notice tone={message.ok ? "success" : "danger"}>{message.text}</Notice>}
              <div className="ha-actions is-start">
                <button type="button" className="ha-btn is-primary" disabled={busy || memberRoles.length === 0} aria-busy={busy} onClick={() => save()}>
                  {busy ? "Saving…" : "Save changes"}
                </button>
                {!isSelf && (
                  <button
                    type="button"
                    className={`ha-btn${active ? " is-danger" : ""}`}
                    disabled={busy}
                    onClick={() => save({ status: active ? "suspended" : "active" })}
                  >
                    {active ? "Deactivate" : "Reactivate"}
                  </button>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

const EMPTY_STAFF: NewStaff = {
  permissions: [],
  rooftop_roles: [],
  name: "",
  email: "",
  phone: "",
  password: "",
  password_confirmation: "",
  roles: [],
  rooftop_id: null,
  spending_limit: "",
};

function AddStaff({ roles, delegable, rooftops, onAdd }: { roles: TeamRole[]; delegable: string[]; rooftops: TeamRooftop[]; onAdd: (input: NewStaff) => Promise<{ ok: boolean; message?: string }> }) {
  const [form, setForm] = useState<NewStaff>(EMPTY_STAFF);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setDone(false);
    const result = await onAdd(form);
    setBusy(false);
    if (result.ok) {
      setForm(EMPTY_STAFF);
      setDone(true);
    } else {
      setError(result.message ?? "Could not add this person.");
    }
  }

  const set = (key: keyof NewStaff) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });

  return (
    <Card className="mb-4" title="Add a member of staff" description="They sign in with the initial password you set, then change it.">
      <form onSubmit={submit} className="ha-card-body">
        <div className="ha-form-grid">
          <div className="ha-field">
            <label htmlFor="staff-name">Full name</label>
            <input id="staff-name" className="ha-input" value={form.name} onChange={set("name")} required autoComplete="off" />
          </div>
          <div className="ha-field">
            <label htmlFor="staff-email">Email</label>
            <input id="staff-email" type="email" className="ha-input" value={form.email} onChange={set("email")} required autoComplete="off" />
          </div>
          <div className="ha-field">
            <label htmlFor="staff-phone">Phone (optional)</label>
            <input id="staff-phone" type="tel" className="ha-input" value={form.phone} onChange={set("phone")} />
          </div>
          <div className="ha-field">
            <label htmlFor="staff-rooftop">Home rooftop</label>
            <select
              id="staff-rooftop"
              className="ha-select"
              value={form.rooftop_id ?? ""}
              onChange={(e) => setForm({ ...form, rooftop_id: e.target.value === "" ? null : Number(e.target.value) })}
            >
              <option value="">No rooftop</option>
              {rooftops.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="ha-field">
            <label htmlFor="staff-password">Initial password</label>
            <input id="staff-password" type="password" className="ha-input" value={form.password} onChange={set("password")} required autoComplete="new-password" />
          </div>
          <div className="ha-field">
            <label htmlFor="staff-password-confirm">Confirm password</label>
            <input id="staff-password-confirm" type="password" className="ha-input" value={form.password_confirmation} onChange={set("password_confirmation")} required autoComplete="new-password" />
          </div>
          <div className="ha-field">
            <label htmlFor="staff-limit">Spending limit (£, optional)</label>
            <input id="staff-limit" type="number" min={0} step="0.01" className="ha-input" placeholder="No limit" value={form.spending_limit} onChange={set("spending_limit")} />
          </div>
        </div>
        <div className="ha-team-editor">
          <fieldset className="ha-field">
            <legend>Roles (at least one)</legend>
            <RoleChecks roles={roles} value={form.roles} onChange={(next) => setForm({ ...form, roles: next })} />
          </fieldset>
          {delegable.length > 0 && (
            <fieldset className="ha-field">
              <legend>Extra permissions (optional)</legend>
              <PermissionChecks
                options={delegable}
                roleGiven={new Set(roles.filter((r) => form.roles.includes(r.name)).flatMap((r) => r.permissions))}
                value={form.permissions}
                onChange={(next) => setForm({ ...form, permissions: next })}
              />
            </fieldset>
          )}
        </div>
        {error && <Notice tone="danger">{error}</Notice>}
        {done && <Notice tone="success">Added. Share the initial password with them; they can change it after signing in.</Notice>}
        <button type="submit" className="ha-btn is-primary" disabled={busy || form.roles.length === 0} aria-busy={busy}>
          {busy ? "Adding…" : "Add staff"}
        </button>
      </form>
    </Card>
  );
}

function Rooftops({ rooftops, onSave }: { rooftops: TeamRooftop[]; onSave: (id: number | null, data: Partial<TeamRooftop>) => Promise<{ ok: boolean; message?: string }> }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function add(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const result = await onSave(null, { name, city: city || null, postcode: postcode || null });
    if (result.ok) {
      setName("");
      setCity("");
      setPostcode("");
    } else {
      setError(result.message ?? "Could not add the rooftop.");
    }
  }

  return (
    <Card title="Rooftops" description="Your dealership's sites. Staff can be confined to one, or hold different roles at each.">
      {rooftops.length === 0 && <EmptyState icon="icon-carus-mappinline" title="No rooftops yet" text="Add your first site below." />}
      {rooftops.length > 0 && (
        <DataTable caption="Rooftops">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Location</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="ha-visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rooftops.map((r) => (
              <tr key={r.id}>
                <td data-label="Name" className="ha-primary-text">{r.name}</td>
                <td data-label="Location">{[r.city, r.postcode].filter(Boolean).join(", ") || "—"}</td>
                <td data-label="Status">
                  <StatusBadge status={r.status} tone={r.status === "active" ? "success" : "neutral"} />
                </td>
                <td data-label="" className="ha-right">
                  <button type="button" className="ha-btn is-sm" onClick={() => onSave(r.id, { status: r.status === "active" ? "inactive" : "active" })}>
                    {r.status === "active" ? "Mark inactive" : "Mark active"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
      <form onSubmit={add} className="ha-toolbar" style={{ borderTop: "1px solid var(--hmp-border)", borderBottom: 0 }} aria-label="Add a rooftop">
        <input className="ha-input" style={{ maxWidth: 220 }} placeholder="Rooftop name" aria-label="Rooftop name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="ha-input" style={{ maxWidth: 160 }} placeholder="City" aria-label="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <input className="ha-input" style={{ maxWidth: 120 }} placeholder="Postcode" aria-label="Postcode" value={postcode} onChange={(e) => setPostcode(e.target.value.toUpperCase())} />
        <button type="submit" className="ha-btn is-primary" disabled={!name.trim()}>
          Add rooftop
        </button>
      </form>
      {error && (
        <div className="ha-card-body" style={{ paddingTop: 0 }}>
          <Notice tone="danger">{error}</Notice>
        </div>
      )}
    </Card>
  );
}

/**
 * REQ RBAC-003 / SRS §2.2 P3 delegated administration: the Org Admin manages their own
 * organization's staff, dealership roles, rooftops and spending limits.
 */
export default function Team() {
  const { user } = useAuth();
  const { staff, rooftops, roles, delegable, loading, error, addStaff, updateStaff, saveRooftop } = useOrganizationTeam();

  const controls = useListControls<TeamMember>({
    items: staff,
    search: (member) => [member.name, member.email],
    filters: [
      { key: "role", label: "Role", get: (member) => member.roles, options: roles.map((role) => ({ value: role.name, label: role.label })) },
      { key: "rooftop", label: "Rooftop", get: (member) => (member.rooftop ? String(member.rooftop.id) : null), options: rooftops.map((r) => ({ value: String(r.id), label: r.name })) },
      { key: "status", label: "Status", get: (member) => member.status },
    ],
  });

  return (
    <DashboardPage
      title="Team & roles"
      description="Add staff, choose what each person can do, assign them to a rooftop and set a spending limit for auction buying."
    >
      {loading && <LoadingTable label="Loading your team" columns={5} />}
      {error && <Notice tone="danger">{error}</Notice>}

      {!loading && !error && (
        <>
          <Notice tone="info">
            A role under <b>Roles</b> applies across the whole dealership; under <b>Rooftop roles</b> it applies at that rooftop only — so someone can be Sales Manager in
            Leeds and Sales Executive in York. A person with a home rooftop is confined to it. Hover a role to see its permissions.
          </Notice>
          <Card className="mb-4" title="Staff">
            <DataToolbar controls={controls} searchPlaceholder="Search name or email" noun="person" />
            {controls.results.length === 0 ? (
              <NoMatches onClear={controls.clearAll} />
            ) : (
              <DataTable caption="Staff">
                <thead>
                  <tr>
                    <th scope="col">Person</th>
                    <th scope="col">Roles</th>
                    <th scope="col">Rooftop</th>
                    <th scope="col" className="is-num">Spending limit</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="ha-visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {controls.results.map((member) => (
                    <StaffRow
                      key={`${member.id}-${member.roles.join(",")}-${member.extra_permissions.join(",")}-${JSON.stringify(member.rooftop_roles)}-${member.status}`}
                      member={member}
                      isSelf={member.id === user?.id}
                      roles={roles}
                      delegable={delegable}
                      rooftops={rooftops}
                      onSave={updateStaff}
                    />
                  ))}
                </tbody>
              </DataTable>
            )}
          </Card>
          <AddStaff roles={roles} delegable={delegable} rooftops={rooftops} onAdd={addStaff} />
          <Rooftops rooftops={rooftops} onSave={saveRooftop} />
        </>
      )}
    </DashboardPage>
  );
}
