"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, describeApiError } from "@/lib/api-client";

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
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-2">Trade credit</h1>
                  <p className="text-color-1 mb-3">
                    A trade credit line lets you bid and buy at auction without a deposit for every lot. We check your business
                    (KYB) and trading history before deciding.
                  </p>

                  {!pending && (
                    <form onSubmit={apply} className="tfcl-card p-3 mb-4" style={{ maxWidth: 460 }}>
                      <label htmlFor="credit-limit" className="mb-1">Credit limit you&apos;d like (£)</label>
                      <input id="credit-limit" type="number" min={1} step={100} className="form-control mb-2" value={limit} onChange={(e) => setLimit(e.target.value)} required />
                      {error && <div className="alert alert-danger py-1">{error}</div>}
                      <button type="submit" className="sc-button" disabled={busy || !limit}>
                        <span>{busy ? "Submitting..." : "Apply for trade credit"}</span>
                      </button>
                    </form>
                  )}
                  {notice && <div className="alert alert-success">{notice}</div>}

                  <h4 className="mb-2">Your applications</h4>
                  {loading && <p>Loading...</p>}
                  {!loading && applications.length === 0 && <p className="tfcl-empty-data">No applications yet.</p>}
                  {applications.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Applied</th>
                            <th>Type</th>
                            <th>Decision</th>
                            <th>Limit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.map((a) => (
                            <tr key={a.id}>
                              <td>{new Date(a.created_at).toLocaleDateString("en-GB")}</td>
                              <td>{a.is_reassessment ? "Quarterly review" : "Application"}</td>
                              <td>{DECISION_LABEL[a.decision] ?? a.decision}</td>
                              <td>{a.assigned_limit ? `£${Number(a.assigned_limit).toLocaleString("en-GB")}` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
