"use client";

import { useState } from "react";
import Link from "next/link";
import { can, useAuth } from "@/contexts/AuthContext";
import {
  useTrustSafetyCase,
  useTrustSafetyCases,
  type ResolveInput,
  type TrustSafetyStatus,
} from "@/hooks/useTrustSafetyCases";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Badge, Card, DataTable, EmptyState, ErrorNotice, LoadingRows, LoadingTable, Notice, Pager, StatusBadge, Tabs, type Tone } from "@/components/ui/kit";

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
const SEVERITY_TONE: Record<string, Tone> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};
const STATUS_TABS = ["open", "actioned", "dismissed", "all"] as const;

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
    <section className="ha-card mb-4" aria-label={`Case ${caseId}`}>
      <div className="ha-card-head">
        <h2>Case #{caseId}</h2>
        <button type="button" className="ha-btn is-sm is-ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="ha-card-body">

      {loading && <LoadingRows rows={4} label="Loading case" />}
      {error && <Notice tone="danger">{error}</Notice>}

      {detail && (
        <>
          <dl className="ha-dl mb-4">
            <div>
              <dt>Severity</dt>
              <dd>
                <Badge tone={SEVERITY_TONE[detail.severity] ?? "neutral"}>{detail.severity}</Badge>
              </dd>
            </div>
            <div>
              <dt>Reason</dt>
              <dd>{reasonLabel(detail.reason)}</dd>
            </div>
            <div>
              <dt>Raised</dt>
              <dd>{when(detail.created_at)}</dd>
            </div>
            <div>
              <dt>Sender</dt>
              <dd>
                {detail.reported_user?.name ?? "Unknown"}{" "}
                {detail.reported_user?.status === "suspended" && <Badge tone="danger">Suspended</Badge>}
                <div className="ha-sub">{detail.reported_user?.email}</div>
              </dd>
            </div>
          </dl>

          {detail.conversation && (
            <>
              <h2 className="hd-card-title">Conversation</h2>
              <p className="ha-muted mb-2">
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
                      className={`ha-message${isCaseMessage ? " is-case" : message.flagged ? " is-flagged" : ""}`}
                    >
                      <div className="ha-sub">
                        {message.sender?.name ?? "Unknown"} ·{" "}
                        {when(message.created_at)}
                        {isCaseMessage && (
                          <b className="ha-inline-error"> · this case</b>
                        )}
                        {!isCaseMessage &&
                          message.flagged &&
                          ` · also flagged (${reasonLabel(message.flagged_reason ?? "")})`}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {message.body}
                      </div>
                      {message.attachment_count > 0 && (
                        <div className="ha-sub">
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
              <fieldset className="ha-field">
              <legend>Resolve</legend>
              <div className="ha-check-list mb-3">
                <label className="ha-check">
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
                  />
                  Dismiss (false positive)
                </label>
                <label className="ha-check">
                  <input
                    type="radio"
                    name="resolution"
                    checked={form.resolution === "actioned"}
                    onChange={() =>
                      setForm({ ...form, resolution: "actioned" })
                    }
                  />
                  Action (confirmed violation)
                </label>
              </div>
              </fieldset>
              {form.resolution === "actioned" && (
                <label className="ha-check mb-3">
                  <input
                    type="checkbox"
                    checked={form.suspendUser}
                    onChange={(e) =>
                      setForm({ ...form, suspendUser: e.target.checked })
                    }
                  />
                  Also suspend {detail.reported_user?.name ?? "the sender"}
                </label>
              )}
              <input
                type="text"
                className="ha-input mb-3"
                placeholder="Note (optional, max 255 characters)"
                maxLength={255}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                aria-label="Resolution note"
              />
              <button type="submit" className={`ha-btn ${form.resolution === "actioned" ? "is-danger-solid" : "is-primary"}`} disabled={resolving} aria-busy={resolving}>
                  {resolving
                    ? "Saving…"
                    : form.resolution === "actioned"
                      ? "Action case"
                      : "Dismiss case"}
                </button>
            </form>
          ) : (
            <p className="mb-0">
              <StatusBadge status={detail.status} /> on{" "}
              {when(detail.resolved_at)}
              {detail.resolution_note ? `: ${detail.resolution_note}` : ""}
            </p>
          )}
        </>
      )}
      </div>
    </section>
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

      <div className="mb-3">
        <Tabs
          label="Case status"
          value={status}
          options={STATUS_TABS}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
      </div>

      <Card>
        {loading && <LoadingTable label="Loading cases" columns={6} />}
        {error && <ErrorNotice message={error} />}
        {!loading && !error && cases.length === 0 && (
          <EmptyState icon="icon-carus-shieldcheck" title="No cases here" text={status === "open" ? "Nothing waiting for review." : "No cases match this status."} />
        )}

        {cases.length > 0 && (
          <DataTable caption="Trust and Safety cases">
            <thead>
              <tr>
                <th scope="col">Severity</th>
                <th scope="col">Reason</th>
                <th scope="col">Sender</th>
                <th scope="col">Message</th>
                <th scope="col">Raised</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="ha-visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => (
                <tr key={item.id} aria-current={item.id === selectedId ? "true" : undefined} className={item.id === selectedId ? "is-selected" : undefined}>
                  <td data-label="Severity">
                    <Badge tone={SEVERITY_TONE[item.severity] ?? "neutral"}>{item.severity}</Badge>
                  </td>
                  <td data-label="Reason">{reasonLabel(item.reason)}</td>
                  <td data-label="Sender">
                    {item.reported_user?.name ?? "—"}
                    {item.reported_user?.status === "suspended" && (
                      <div>
                        <Badge tone="danger">Suspended</Badge>
                      </div>
                    )}
                  </td>
                  <td data-label="Message" style={{ maxWidth: 280 }}>
                    <span className="d-inline-block text-truncate" style={{ maxWidth: 280 }} title={item.message_body ?? ""}>
                      {item.message_body ?? "—"}
                    </span>
                  </td>
                  <td data-label="Raised" className="ha-num">{when(item.created_at)}</td>
                  <td data-label="Status">
                    <StatusBadge status={item.status} tone={item.status === "open" ? "warning" : undefined} />
                  </td>
                  <td data-label="" className="ha-right">
                    <button type="button" className={`ha-btn is-sm${item.status === "open" ? " is-primary" : ""}`} onClick={() => setSelectedId(item.id)}>
                      {item.status === "open" ? "Review" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
        <Pager page={page} lastPage={lastPage} total={total} onChange={setPage} />
      </Card>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAnalyst =
    can(user, "admin-fraud-actions");

  return (
    <DashboardPage title="Trust & Safety" description="Messages auto-flagged for personal details or off-platform payment, reviewed in the context of the whole conversation.">
      {!isAnalyst && (
        <Card>
          <EmptyState icon="icon-carus-shieldcheck" title="Analysts only" text="This queue is for Trust & Safety analysts only." />
        </Card>
      )}

      {isAnalyst && <Queue />}
    </DashboardPage>
  );
}
