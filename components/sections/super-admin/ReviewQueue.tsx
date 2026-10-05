"use client";

import Link from "next/link";
import { useState } from "react";
import SuperAdminShell from "./SuperAdminShell";
import { Badge, Card, EmptyState, ErrorNotice, LoadingRows, Pager, SearchInput, Tabs, useDebouncedValue } from "@/components/admin/ui";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import { formatWhen, humanize, pageInfo, type ModerationQueueItem, type Paginated } from "@/lib/superAdmin";

const VIEWS = ["awaiting review", "live", "draft", "all"] as const;
const STATUS_FOR: Record<(typeof VIEWS)[number], string> = {
  "awaiting review": "pending_checks",
  live: "live",
  draft: "draft",
  all: "all",
};

/**
 * FR-C-001 PendingChecks → Live: the queue of listings sellers have submitted, oldest first.
 * Each opens the full review page (car, photos, documents, checks) to approve or decline.
 */
export default function ReviewQueue() {
  const [view, setView] = useState<(typeof VIEWS)[number]>("awaiting review");
  const [q, setQ] = useState("");
  const search = useDebouncedValue(q.trim());
  const [page, setPage] = useState(1);

  const qs = new URLSearchParams({ status: STATUS_FOR[view], page: String(page) });
  if (search) qs.set("q", search);
  const { data, loading, error } = useAdminResource<Paginated<ModerationQueueItem>>(`/moderation/listings?${qs.toString()}`);
  const info = data ? pageInfo(data) : null;

  return (
    <SuperAdminShell
      title="Listing review"
      intro="New listings wait here until someone has checked the car, its photos and documents. Approve to put a listing live, or decline it back to the seller with what to fix."
    >
      <Card>
        <div className="ha-toolbar">
          <Tabs label="Queue" value={view} options={VIEWS} onChange={(next) => { setView(next); setPage(1); }} />
          <SearchInput label="Search listings" placeholder="Make, model, VRM or id" value={q} onChange={(v) => { setQ(v); setPage(1); }} />
        </div>
        {loading && !data && <LoadingRows />}
        {error && <ErrorNotice message={error} />}
        {data && data.data.length === 0 && (
          <EmptyState icon="icon-carus-checkcircle" title={view === "awaiting review" ? "Nothing waiting for review" : "No listings here"} text={view === "awaiting review" ? "Listings sellers submit will appear here." : undefined} />
        )}
        {data && data.data.length > 0 && (
          <div className="ha-table-wrap">
            <table className="ha-table">
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Seller</th>
                  <th>Evidence</th>
                  <th>Status</th>
                  <th className="ha-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ width: 72, height: 50, borderRadius: 8, overflow: "hidden", background: "var(--ha-surface-2)", flexShrink: 0 }}>
                          {item.photo_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          )}
                        </div>
                        <div>
                          <div className="ha-primary-text">{item.title}</div>
                          <div className="ha-sub">{item.vrm ?? "No VRM"} · £{Number(item.price).toLocaleString("en-GB")}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{item.seller.name ?? "—"}</div>
                      <div className="ha-sub" style={{ textTransform: "capitalize" }}>{item.seller.kind} seller</div>
                    </td>
                    <td className="ha-sub">
                      {item.photos_count} photo{item.photos_count === 1 ? "" : "s"} · {item.documents_count} document{item.documents_count === 1 ? "" : "s"}
                    </td>
                    <td>
                      <Badge tone={item.status === "pending_checks" ? "warning" : item.status === "live" ? "success" : "neutral"}>
                        {item.status === "pending_checks" ? "awaiting review" : humanize(item.status)}
                      </Badge>
                      {item.submitted_at && item.status === "pending_checks" && <div className="ha-sub" style={{ marginTop: 4 }}>Submitted {formatWhen(item.submitted_at)}</div>}
                      {item.review_note && item.status === "draft" && <div className="ha-sub" style={{ marginTop: 4, color: "var(--ha-danger)" }}>Declined</div>}
                    </td>
                    <td className="ha-right">
                      <Link href={`/admin/listings/${item.id}`} className={`ha-btn is-sm${item.status === "pending_checks" ? " is-primary" : ""}`}>
                        {item.status === "pending_checks" ? "Review" : "View"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {info && <Pager page={info.page} lastPage={info.lastPage} total={info.total} onChange={setPage} />}
      </Card>
    </SuperAdminShell>
  );
}
