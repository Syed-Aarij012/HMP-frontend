"use client";

import { useState, type FormEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useAuth } from "@/contexts/AuthContext";
import {
  useOrganizationTeam,
  type NewStaff,
  type TeamMember,
  type TeamRole,
  type TeamRooftop,
} from "@/hooks/useOrganizationTeam";

function RoleChecks({ roles, value, onChange, disabled }: { roles: TeamRole[]; value: string[]; onChange: (next: string[]) => void; disabled?: boolean }) {
  return (
    <div className="d-flex flex-column gap-1">
      {roles.map((role) => (
        <label key={role.name} className="fs-13" title={role.permissions.join(", ")} style={{ cursor: disabled ? "default" : "pointer" }}>
          <input
            type="checkbox"
            disabled={disabled}
            checked={value.includes(role.name)}
            onChange={(e) => onChange(e.target.checked ? [...value, role.name] : value.filter((r) => r !== role.name))}
          />{" "}
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
    <div className="d-flex flex-column gap-1">
      {options.map((permission) => {
        const fromRole = roleGiven.has(permission);
        return (
          <label key={permission} className="fs-13" style={{ cursor: disabled || fromRole ? "default" : "pointer", opacity: fromRole ? 0.6 : 1 }}>
            <input
              type="checkbox"
              disabled={disabled || fromRole}
              checked={fromRole || value.includes(permission)}
              onChange={(e) => onChange(e.target.checked ? [...value, permission] : value.filter((p) => p !== permission))}
            />{" "}
            {PERMISSION_LABELS[permission] ?? permission}
            {fromRole && <span className="text-color-2"> (from role)</span>}
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
  if (rooftops.length === 0 || bindable.length === 0) return <span className="fs-13 text-color-2">No rooftops yet.</span>;

  return (
    <div className="d-flex flex-column gap-2">
      {rooftops.map((rooftop) => (
        <div key={rooftop.id}>
          <div className="fs-13 fw-bold">{rooftop.name}</div>
          <div className="d-flex flex-wrap gap-2">
            {bindable.map((role) => {
              const held = (value[rooftop.id] ?? []).includes(role.name);
              return (
                <label key={role.name} className="fs-13" style={{ cursor: disabled ? "default" : "pointer" }}>
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
                  />{" "}
                  {role.label}
                </label>
              );
            })}
          </div>
        </div>
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

  return (
    <tr>
      <td>
        <b>{member.name}</b>
        {isSelf && <span className="badge bg-light text-dark border ms-1">You</span>}
        <div className="fs-13 text-color-2">{member.email}</div>
        <span className={`badge ${member.status === "active" ? "bg-success" : "bg-danger"} text-capitalize`}>
          {member.status === "suspended" ? "deactivated" : member.status}
        </span>
      </td>
      <td style={{ minWidth: 180 }}>
        <RoleChecks roles={roles} value={memberRoles} onChange={setMemberRoles} disabled={isSelf} />
        {isSelf && <div className="fs-13 text-color-2 mt-1">Another Org Admin changes your roles.</div>}
      </td>
      <td style={{ minWidth: 220 }}>
        <PermissionChecks options={delegable} roleGiven={roleGiven} value={extra} onChange={setExtra} disabled={isSelf} />
      </td>
      <td style={{ minWidth: 240 }}>
        <RooftopRolesEditor rooftops={rooftops} roles={roles} wideRoles={memberRoles} value={rooftopRoles} onChange={setRooftopRoles} disabled={isSelf} />
      </td>
      <td style={{ minWidth: 160 }}>
        <select className="form-control" aria-label="Rooftop" value={rooftopId} onChange={(e) => setRooftopId(e.target.value)}>
          <option value="">No rooftop</option>
          {rooftops.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </td>
      <td style={{ minWidth: 140 }}>
        <input
          type="number"
          min={0}
          step="0.01"
          className="form-control"
          aria-label="Spending limit"
          placeholder="No limit"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
        />
      </td>
      <td style={{ minWidth: 170 }}>
        <div className="d-flex flex-column gap-1">
          <button type="button" className="sc-button" disabled={busy || memberRoles.length === 0} onClick={() => save()}>
            <span>{busy ? "Saving..." : "Save"}</span>
          </button>
          {!isSelf && (
            <button
              type="button"
              className="sc-button"
              disabled={busy}
              onClick={() => save({ status: member.status === "active" ? "suspended" : "active" })}
            >
              <span>{member.status === "active" ? "Deactivate" : "Reactivate"}</span>
            </button>
          )}
          {message && <div className={`fs-13 ${message.ok ? "text-success" : "text-danger"}`}>{message.text}</div>}
        </div>
      </td>
    </tr>
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
    <form onSubmit={submit} className="tfcl-card p-3 mb-4">
      <h4 className="mb-2">Add a member of staff</h4>
      <div className="row">
        <div className="col-md-6 mb-2">
          <input className="form-control" placeholder="Full name" aria-label="Full name" value={form.name} onChange={set("name")} required />
        </div>
        <div className="col-md-6 mb-2">
          <input type="email" className="form-control" placeholder="Email" aria-label="Email" value={form.email} onChange={set("email")} required />
        </div>
        <div className="col-md-6 mb-2">
          <input className="form-control" placeholder="Phone (optional)" aria-label="Phone" value={form.phone} onChange={set("phone")} />
        </div>
        <div className="col-md-6 mb-2">
          <select
            className="form-control"
            aria-label="Rooftop"
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
        <div className="col-md-6 mb-2">
          <input type="password" className="form-control" placeholder="Initial password" aria-label="Initial password" value={form.password} onChange={set("password")} required autoComplete="new-password" />
        </div>
        <div className="col-md-6 mb-2">
          <input type="password" className="form-control" placeholder="Confirm password" aria-label="Confirm password" value={form.password_confirmation} onChange={set("password_confirmation")} required autoComplete="new-password" />
        </div>
        <div className="col-md-6 mb-2">
          <input type="number" min={0} step="0.01" className="form-control" placeholder="Spending limit (£, optional)" aria-label="Spending limit" value={form.spending_limit} onChange={set("spending_limit")} />
        </div>
      </div>
      <div className="mb-2">
        <div className="fw-bold mb-1">Roles</div>
        <RoleChecks roles={roles} value={form.roles} onChange={(next) => setForm({ ...form, roles: next })} />
      </div>
      {delegable.length > 0 && (
        <div className="mb-2">
          <div className="fw-bold mb-1">Extra permissions (optional)</div>
          <PermissionChecks
            options={delegable}
            roleGiven={new Set(roles.filter((r) => form.roles.includes(r.name)).flatMap((r) => r.permissions))}
            value={form.permissions}
            onChange={(next) => setForm({ ...form, permissions: next })}
          />
        </div>
      )}
      {error && <div className="alert alert-danger py-1">{error}</div>}
      {done && <div className="text-success fs-13 mb-2">Added. Share the initial password with them; they can change it after signing in.</div>}
      <button type="submit" className="sc-button" disabled={busy || form.roles.length === 0}>
        <span>{busy ? "Adding..." : "Add staff"}</span>
      </button>
    </form>
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
    <div className="tfcl-card p-3">
      <h4 className="mb-2">Rooftops</h4>
      {rooftops.length === 0 && <p className="text-color-2">No rooftops yet.</p>}
      {rooftops.length > 0 && (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rooftops.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{[r.city, r.postcode].filter(Boolean).join(", ") || "-"}</td>
                  <td className="text-capitalize">{r.status}</td>
                  <td>
                    <button type="button" className="sc-button" onClick={() => onSave(r.id, { status: r.status === "active" ? "inactive" : "active" })}>
                      <span>{r.status === "active" ? "Mark inactive" : "Mark active"}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form onSubmit={add} className="d-flex flex-wrap gap-2 mt-2">
        <input className="form-control" style={{ maxWidth: 220 }} placeholder="Rooftop name" aria-label="Rooftop name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="form-control" style={{ maxWidth: 160 }} placeholder="City" aria-label="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <input className="form-control" style={{ maxWidth: 120 }} placeholder="Postcode" aria-label="Postcode" value={postcode} onChange={(e) => setPostcode(e.target.value.toUpperCase())} />
        <button type="submit" className="sc-button" disabled={!name.trim()}>
          <span>Add rooftop</span>
        </button>
      </form>
      {error && <div className="alert alert-danger py-1 mt-2">{error}</div>}
    </div>
  );
}

/**
 * REQ RBAC-003 / SRS §2.2 P3 delegated administration: the Org Admin manages their own
 * organization's staff, dealership roles, rooftops and spending limits.
 */
export default function Team() {
  const { user } = useAuth();
  const { staff, rooftops, roles, delegable, loading, error, addStaff, updateStaff, saveRooftop } = useOrganizationTeam();

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-2">Team &amp; roles</h1>
                  <p className="text-color-2 mb-3">
                    Add staff, choose what each person can do, assign them to a rooftop and set a spending limit for auction
                    buying. Hover a role to see its permissions. A role under <b>Roles</b> applies across the whole dealership; under
                    <b> Rooftop roles</b> it applies at that rooftop only — so someone can be Sales Manager in Leeds and Sales Executive
                    in York. A person with a home rooftop is confined to it.
                  </p>

                  {loading && <p>Loading your team...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}

                  {!loading && !error && (
                    <>
                      <div className="table-responsive mb-4">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Person</th>
                              <th>Roles</th>
                              <th>Extra permissions</th>
                              <th>Rooftop roles</th>
                              <th>Rooftop</th>
                              <th>Spending limit (£)</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {staff.map((member) => (
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
                        </table>
                      </div>
                      <AddStaff roles={roles} delegable={delegable} rooftops={rooftops} onAdd={addStaff} />
                      <Rooftops rooftops={rooftops} onSave={saveRooftop} />
                    </>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
