"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";

export type TeamRole = { name: string; label: string; permissions: string[] };

export type TeamRooftop = {
  id: number;
  name: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  phone: string | null;
  status: "active" | "inactive";
};

export type TeamMember = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "suspended" | "banned";
  roles: string[];
  // Permissions the Org Admin granted this person directly, on top of their roles (SRS §2.2 P3).
  extra_permissions: string[];
  // Roles held at one rooftop only (REQ RBAC-003), e.g. Sales Manager in Leeds.
  rooftop_roles: { rooftop_id: number; roles: string[] }[];
  rooftop: { id: number; name: string } | null;
  spending_limit: string | null;
  mfa_enabled: boolean;
};

export type NewStaff = {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  roles: string[];
  permissions: string[];
  rooftop_roles: { rooftop_id: number; roles: string[] }[];
  rooftop_id: number | null;
  spending_limit: string;
};

export type StaffChanges = {
  roles?: string[];
  rooftop_roles?: { rooftop_id: number; roles: string[] }[];
  permissions?: string[];
  rooftop_id?: number | null;
  spending_limit?: number | null;
  status?: "active" | "suspended";
};

type Result = { ok: true } | { ok: false; message: string };

/**
 * REQ RBAC-003 / SRS §2.2 P3: the Org Admin's delegated administration of their own
 * organization — staff, their dealership roles, rooftops and spending limits.
 */
export function useOrganizationTeam() {
  const [staff, setStaff] = useState<TeamMember[]>([]);
  const [rooftops, setRooftops] = useState<TeamRooftop[]>([]);
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [delegable, setDelegable] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [team, roleList] = await Promise.all([
        apiFetch<{ data: TeamMember[]; rooftops: TeamRooftop[] }>("/organization/staff"),
        apiFetch<{ data: TeamRole[]; delegable_permissions: string[] }>("/organization/roles"),
      ]);
      setStaff(team.data);
      setRooftops(team.rooftops);
      setRoles(roleList.data);
      setDelegable(roleList.delegable_permissions ?? []);
      setError(null);
    } catch (err) {
      setError(describeApiError(err, "Could not load your team."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const run = useCallback(
    async (path: string, method: "POST" | "PATCH", body: Record<string, unknown>, fallback: string): Promise<Result> => {
      try {
        await apiFetch(path, { method, body });
        await load();
        return { ok: true };
      } catch (err) {
        return { ok: false, message: describeApiError(err, fallback) };
      }
    },
    [load],
  );

  const addStaff = (input: NewStaff) =>
    run(
      "/organization/staff",
      "POST",
      {
        ...input,
        phone: input.phone.trim() || null,
        spending_limit: input.spending_limit === "" ? null : Number(input.spending_limit),
      },
      "Could not add this person.",
    );

  const updateStaff = (id: number, changes: StaffChanges) =>
    run(`/organization/staff/${id}`, "PATCH", changes, "Could not save the changes.");

  const saveRooftop = (id: number | null, data: Partial<TeamRooftop>) =>
    run(id === null ? "/organization/rooftops" : `/organization/rooftops/${id}`, id === null ? "POST" : "PATCH", data, "Could not save the rooftop.");

  return { staff, rooftops, roles, delegable, loading, error, addStaff, updateStaff, saveRooftop };
}
