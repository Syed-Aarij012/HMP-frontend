"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, describeApiError } from "@/lib/api-client";

type AccessRequest = { id: number; agent: string | null; reason: string; requested_at: string | null };

/**
 * SRS §2.2 Customer Support impersonation-view is *consented*: a support agent's request to view
 * your account (read-only) waits here until you allow or deny it.
 */
export default function SupportAccessRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRequests((await apiFetch<{ data: AccessRequest[] }>("/me/support-access-requests")).data);
    } catch {
      setRequests([]);
    }
  }, []);

  useEffect(() => {
    if (user && !user.impersonation) queueMicrotask(load);
  }, [user, load]);

  async function decide(id: number, decision: "approve" | "deny") {
    setError(null);
    try {
      await apiFetch(`/me/support-access-requests/${id}`, { method: "POST", body: { decision } });
      await load();
    } catch (err) {
      setError(describeApiError(err, "Could not record your answer."));
    }
  }

  if (requests.length === 0) return null;

  return (
    <div className="container" style={{ paddingTop: 16 }}>
      {requests.map((request) => (
        <div key={request.id} className="alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <b>{request.agent ?? "HMP Support"}</b> from HMP Support is asking to view your account (read-only) to help with:
            <i> “{request.reason}”</i>. They won&apos;t be able to change anything, and the view ends automatically.
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="sc-button" onClick={() => decide(request.id, "approve")}>
              <span>Allow</span>
            </button>
            <button type="button" className="sc-button" onClick={() => decide(request.id, "deny")}>
              <span>Deny</span>
            </button>
          </div>
        </div>
      ))}
      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
}
