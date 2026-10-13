"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, describeApiError } from "@/lib/api-client";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Card, DataTable, EmptyState, LoadingRows, Notice, StatusBadge, formatDate, formatMoney } from "@/components/ui/kit";

type Application = {
  id: number;
  is_reassessment: boolean;
  decision: string;
  assigned_limit: string | null;
  decided_at: string | null;
  created_at: string;
};

const DECISION_LABEL: Record<string, string> = {
  pending: "Being assessed",
  approve: "Approved",
  approved: "Approved",
  decline: "Declined",
  declined: "Declined",
  refer: "Referred to our credit team",
};

/**
 * SRS §2.2 P4 "trade credit application" (and P3 Org Admin for their dealership): apply for a
 * trade credit line to bid and buy against, and follow the decision.
 */
export default function TradeCredit() {
  const { refreshUser } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setApplications((await apiFetch<{ data: Application[] }>("/trade-credit-applications")).data);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  async function apply(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiFetch("/trade-credit-applications", { method: "POST", body: { requested_limit: Number(limit) } });
      setNotice("Application submitted. You'll see the decision here.");
      setLimit("");
      await refreshUser();
      await load();
    } catch (err) {
      setError(describeApiError(err, "Could not submit your application."));
    } finally {
      setBusy(false);
    }
  }

  const pending = applications.some((a) => a.decision === "pending" || a.decision === "refer");

  return (
    <DashboardPage title="Trade credit" description="A trade credit line lets you bid and buy at auction without a deposit for every lot. We check your business (KYB) and trading history before deciding.">
      {notice && <Notice tone="success">{notice}</Notice>}
      <div className="ha-grid is-2" style={{ alignItems: "start" }}>
        <Card title="Apply for trade credit">
          {pending ? (
            <EmptyState icon="icon-carus-clock" title="Application in progress" text="You have an application being assessed. You'll see the decision here." />
          ) : (
            <form onSubmit={apply} className="ha-card-body">
              <div className="ha-field">
                <label htmlFor="credit-limit">Credit limit you&apos;d like (£)</label>
                <input id="credit-limit" type="number" min={1} step={100} className="ha-input" value={limit} onChange={(e) => setLimit(e.target.value)} required />
              </div>
              {error && <Notice tone="danger">{error}</Notice>}
              <button type="submit" className="ha-btn is-primary" disabled={busy || !limit} aria-busy={busy}>
                {busy ? "Submitting…" : "Apply for trade credit"}
              </button>
            </form>
          )}
        </Card>

        <Card title="Your applications">
          {loading && <LoadingRows rows={3} label="Loading your applications" />}
          {!loading && applications.length === 0 && <EmptyState icon="icon-carus-power" title="No applications yet" text="Your applications and their decisions appear here." />}
          {applications.length > 0 && (
            <DataTable caption="Your trade credit applications">
              <thead>
                <tr>
                  <th scope="col">Applied</th>
                  <th scope="col">Type</th>
                  <th scope="col">Decision</th>
                  <th scope="col" className="is-num">Limit</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id}>
                    <td data-label="Applied" className="ha-num">{formatDate(a.created_at)}</td>
                    <td data-label="Type">{a.is_reassessment ? "Quarterly review" : "Application"}</td>
                    <td data-label="Decision">
                      <StatusBadge status={a.decision} label={DECISION_LABEL[a.decision]} tone={a.decision === "refer" ? "warning" : a.decision === "pending" ? "warning" : undefined} />
                    </td>
                    <td data-label="Limit" className="is-num">{a.assigned_limit ? formatMoney(Number(a.assigned_limit)) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>
      </div>
    </DashboardPage>
  );
}
