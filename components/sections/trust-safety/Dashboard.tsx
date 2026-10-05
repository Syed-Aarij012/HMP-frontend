"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { can, useAuth } from "@/contexts/AuthContext";
import {
  useTrustSafetyCase,
  useTrustSafetyCases,
  type ResolveInput,
  type TrustSafetyStatus,
} from "@/hooks/useTrustSafetyCases";

const REASON_LABELS: Record<string, string> = {
  possible_phone_number: "Phone number shared",
  possible_email_address: "Email address shared",
  possible_off_platform_payment_luring: "Off-platform payment luring",
};

const reasonLabel = (reason: string) =>
  REASON_LABELS[reason] ?? reason.replace(/_/g, " ");
const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";
const SEVERITY_CLASS: Record<string, string> = {
  high: "bg-danger",
  medium: "bg-warning text-dark",
  low: "bg-secondary",
};

function CaseReview({
  caseId,
  onClose,
  onResolved,
}: {
  caseId: number;
  onClose: () => void;
  onResolved: () => void;
}) {
  const { detail, loading, error, resolving, resolve } = useTrustSafetyCase(
    caseId,
    onResolved,
  );
  const [form, setForm] = useState<ResolveInput>({
    resolution: "dismissed",
    note: "",
    suspendUser: false,
  });

  return (
    <div className="tfcl-card p-3 mb-4">
      <div className="d-flex justify-content-between align-items-start mb-2">
        <h4 className="mb-0">Case #{caseId}</h4>
        <button type="button" className="sc-button" onClick={onClose}>
          <span>Close</span>
        </button>
      </div>

      {loading && <p>Loading case...</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {detail && (
        <>
          <p className="mb-1">
            <span
              className={`badge ${SEVERITY_CLASS[detail.severity] ?? "bg-secondary"} me-2 text-capitalize`}
            >
              {detail.severity}
            </span>
            {reasonLabel(detail.reason)} · raised {when(detail.created_at)}
          </p>
          <p className="mb-3">
            Sender: <b>{detail.reported_user?.name ?? "Unknown"}</b> (
            {detail.reported_user?.email})
            {detail.reported_user?.status === "suspended" && (
              <span className="badge bg-danger ms-2">Suspended</span>
            )}
          </p>

          {detail.conversation && (
            <>
              <h5 className="mb-1">Conversation</h5>
              <p className="text-color-1 mb-2">
                {detail.conversation.listing_id ? (
                  <Link
                    href={`/listing-detail-v1/${detail.conversation.listing_id}`}
                  >
                    {detail.conversation.listing_title ?? "Listing"}
                  </Link>
                ) : (
                  (detail.conversation.listing_title ?? "Listing")
                )}{" "}
                · buyer {detail.conversation.buyer?.name ?? "-"} · seller{" "}
                {detail.conversation.seller?.name ?? "-"}
              </p>
              <ol
                className="list-unstyled mb-3"
                style={{ maxHeight: 360, overflowY: "auto" }}
                aria-label="Conversation thread"
              >
                {detail.conversation.messages.map((message) => {
                  const isCaseMessage =
                    message.id === detail.flagged_message_id;
                  return (
                    <li
                      key={message.id}
                      className="p-2 mb-2"
                      style={{
                        borderRadius: 8,
                        background: isCaseMessage
                          ? "#FDECEC"
                          : message.flagged
                            ? "#FFF6E5"
                            : "#F4F6FB",
                        border: isCaseMessage
                          ? "1px solid #E74C3C"
                          : "1px solid transparent",
                      }}
                    >
                      <div className="fs-13 text-color-1">
                        {message.sender?.name ?? "Unknown"} ·{" "}
                        {when(message.created_at)}
                        {isCaseMessage && (
                          <b className="text-danger"> · this case</b>
                        )}
                        {!isCaseMessage &&
                          message.flagged &&
                          ` · also flagged (${reasonLabel(message.flagged_reason ?? "")})`}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {message.body}
                      </div>
                      {message.attachment_count > 0 && (
                        <div className="fs-13 text-color-1">
                          {message.attachment_count} attachment(s)
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </>
          )}

          {detail.status === "open" ? (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (await resolve(form))
                  setForm({
                    resolution: "dismissed",
                    note: "",
                    suspendUser: false,
                  });
              }}
            >
              <h5 className="mb-2">Resolve</h5>
              <div className="flex gap-20 mb-2" style={{ flexWrap: "wrap" }}>
                <label>
                  <input
                    type="radio"
                    name="resolution"
                    checked={form.resolution === "dismissed"}
                    onChange={() =>
                      setForm({
                        ...form,
                        resolution: "dismissed",
                        suspendUser: false,
                      })
                    }
                  />{" "}
                  Dismiss (false positive)
                </label>
                <label>
                  <input
                    type="radio"
                    name="resolution"
                    checked={form.resolution === "actioned"}
                    onChange={() =>
                      setForm({ ...form, resolution: "actioned" })
                    }
                  />{" "}
                  Action (confirmed violation)
                </label>
              </div>
              {form.resolution === "actioned" && (
                <label className="d-block mb-2">
                  <input
                    type="checkbox"
                    checked={form.suspendUser}
                    onChange={(e) =>
                      setForm({ ...form, suspendUser: e.target.checked })
                    }
                  />{" "}
                  Also suspend {detail.reported_user?.name ?? "the sender"}
                </label>
              )}
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Note (optional, max 255 characters)"
                maxLength={255}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                aria-label="Resolution note"
              />
              <button type="submit" className="sc-button" disabled={resolving}>
                <span>
                  {resolving
                    ? "Saving..."
                    : form.resolution === "actioned"
                      ? "Action case"
                      : "Dismiss case"}
                </span>
              </button>
            </form>
          ) : (
            <p className="mb-0">
              <b className="text-capitalize">{detail.status}</b> on{" "}
              {when(detail.resolved_at)}
              {detail.resolution_note ? `: ${detail.resolution_note}` : ""}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/**
 * FR-C-031: the Trust & Safety analyst's queue — messages auto-escalated by the PII /
 * off-platform-payment detector, reviewed in the context of their whole thread and then
 * dismissed or actioned (optionally suspending the sender).
 */
function Queue() {
  const [status, setStatus] = useState<TrustSafetyStatus | "all">("open");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { cases, lastPage, total, loading, error, reload } =
    useTrustSafetyCases(status, page);

  return (
    <>
      {selectedId !== null && (
        <CaseReview
          key={selectedId}
          caseId={selectedId}
          onClose={() => setSelectedId(null)}
          onResolved={reload}
        />
      )}

      <div
        className="flex gap-10 align-center mb-3"
        style={{ flexWrap: "wrap" }}
      >
        <label htmlFor="ts-status" className="mb-0">
          Show
        </label>
        <select
          id="ts-status"
          className="form-control"
          style={{ maxWidth: 200 }}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as TrustSafetyStatus | "all");
            setPage(1);
          }}
        >
          <option value="open">Open</option>
          <option value="actioned">Actioned</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All</option>
        </select>
        <span className="text-color-1">{total} case(s)</span>
      </div>

      {loading && <p>Loading cases...</p>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && !error && cases.length === 0 && (
        <p className="tfcl-empty-data">No cases here.</p>
      )}

      {cases.length > 0 && (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Reason</th>
                <th>Sender</th>
                <th>Message</th>
                <th>Raised</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => (
                <tr
                  key={item.id}
                  className={
                    item.id === selectedId ? "table-active" : undefined
                  }
                >
                  <td>
                    <span
                      className={`badge ${SEVERITY_CLASS[item.severity] ?? "bg-secondary"} text-capitalize`}
                    >
                      {item.severity}
                    </span>
                  </td>
                  <td>{reasonLabel(item.reason)}</td>
                  <td>
                    {item.reported_user?.name ?? "-"}
                    {item.reported_user?.status === "suspended" && (
                      <span className="badge bg-danger ms-1">Suspended</span>
                    )}
                  </td>
                  <td style={{ maxWidth: 280 }}>
                    <span
                      className="d-inline-block text-truncate"
                      style={{ maxWidth: 280 }}
                      title={item.message_body ?? ""}
                    >
                      {item.message_body ?? "-"}
                    </span>
                  </td>
                  <td>{when(item.created_at)}</td>
                  <td className="text-capitalize">{item.status}</td>
                  <td>
                    <button
                      type="button"
                      className="sc-button"
                      onClick={() => setSelectedId(item.id)}
                    >
                      <span>{item.status === "open" ? "Review" : "View"}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lastPage > 1 && (
        <div className="flex gap-10 align-center">
          <button
            type="button"
            className="sc-button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <span>Previous</span>
          </button>
          <span>
            Page {page} of {lastPage}
          </span>
          <button
            type="button"
            className="sc-button"
            disabled={page >= lastPage}
            onClick={() => setPage(page + 1)}
          >
            <span>Next</span>
          </button>
        </div>
      )}
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAnalyst =
    can(user, "admin-fraud-actions");

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">Trust &amp; Safety</h1>

                  {!isAnalyst && (
                    <p className="tfcl-empty-data">
                      This queue is for Trust &amp; Safety analysts only.
                    </p>
                  )}

                  {isAnalyst && <Queue />}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
