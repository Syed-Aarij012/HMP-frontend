"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import type { Justification } from "@/lib/superAdmin";

/**
 * Loads one Super Admin console resource (§2.2 P7) and reloads it on demand. Access is
 * decided by the backend's 'super-admin' middleware; a 403 surfaces here as the error.
 */
export function useAdminResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (path === null) return;
    setLoading(true);
    try {
      setData(await apiFetch<T>(path));
      setError(null);
    } catch (err) {
      setError(describeApiError(err, "Could not load this from the server."));
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  return { data, loading, error, reload: load };
}

export type AdminActionResult =
  | { ok: true; pendingApproval: boolean; message: string }
  | { ok: false; message: string };

/**
 * Runs a Super Admin write. Every one carries a reason and a ticket reference (REQ RBAC-005).
 * A four-eyes action comes back 202 as a pending request rather than taking effect.
 */
export async function runAdminAction(
  path: string,
  justification: Justification,
  extra: Record<string, unknown> = {},
): Promise<AdminActionResult> {
  try {
    const response = await apiFetch<{ data?: { status?: string }; message?: string }>(path, {
      method: "POST",
      body: { ...extra, ...justification },
    });
    const pendingApproval = response.data?.status === "pending";
    return {
      ok: true,
      pendingApproval,
      message: pendingApproval
        ? "Request raised. It takes effect once a second Super Admin approves it."
        : "Done.",
    };
  } catch (err) {
    return { ok: false, message: describeApiError(err, "That action could not be completed.") };
  }
}
