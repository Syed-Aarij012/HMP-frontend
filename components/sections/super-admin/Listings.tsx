"use client";

import Link from "next/link";
import { useState } from "react";
import SuperAdminShell from "./SuperAdminShell";
import JustifiedAction from "./JustifiedAction";
import { Badge, Card, EmptyState, ErrorNotice, LoadingRows, Pager, SearchInput, useDebouncedValue, type Tone } from "@/components/admin/ui";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import { formatWhen, pageInfo, type AdminListing, type Paginated } from "@/lib/superAdmin";

const STATUSES = ["draft", "pending_checks", "live", "under_offer", "reserved", "withdrawn", "expired", "sold"];
const STATUS_TONE: Record<string, Tone> = { live: "success", under_offer: "primary", reserved: "primary", sold: "dark", pending_checks: "warning", withdrawn: "neutral", expired: "neutral", draft: "neutral" };

/**
 * §2.2 P7 sanctions/fraud actioning — listing takedown (four-eyes). A taken-down listing is
 * withdrawn and its seller can't relist it; restoring lifts the block but leaves it withdrawn.
 */
export default function Listings() {
  const [q, setQ] = useState("");
  const search = useDebouncedValue(q.trim());
  const [status, setStatus] = useState("");
  const [takenDown, setTakenDown] = useState(false);
  const [page, setPage] = useState(1);

  const qs = new URLSearchParams({ page: String(page) });
  if (search) qs.set("q", search);
  if (status) qs.set("status", status);
  if (takenDown) qs.set("taken_down", "1");
  const { data, loading, error, reload } = useAdminResource<Paginated<AdminListing>>(`/admin/listings?${qs.toString()}`);
  const info = data ? pageInfo(data) : null;

  return (
    <SuperAdminShell title="All listings" intro="Every retail listing. A taken-down listing is withdrawn and its seller can't relist it until you restore it.">
      <Card>
        <div className="ha-toolbar">
          <SearchInput label="Search listings" placeholder="Make, model, VRM or listing id" value={q} onChange={(v) => { setQ(v); setPage(1); }} />
          <select className="ha-select" aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
          <label className="ha-check">
            <input type="checkbox" checked={takenDown} onChange={(e) => { setTakenDown(e.target.checked); setPage(1); }} /> Taken down only
          </label>
        </div>
        {loading && !data && <LoadingRows />}
        {error && <ErrorNotice message={error} />}
        {data && data.data.length === 0 && <EmptyState icon="icon-carus-car" title="No listings match" />}
        {data && data.data.length > 0 && (
          <div className="ha-table-wrap">
            <table className="ha-table">
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Seller</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th className="ha-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((listing) => (
                  <tr key={listing.id}>
                    <td>
                      <Link href={`/admin/listings/${listing.id}`} className="ha-primary-text">
                        {listing.title || "Untitled listing"}
                      </Link>
                      <div className="ha-sub">{listing.vrm ?? "No VRM"}</div>
                    </td>
                    <td>
                      <div>{listing.seller.name ?? "-"}</div>
                      <div className="ha-sub" style={{ textTransform: "capitalize" }}>{listing.seller.kind} seller</div>
                    </td>
                    <td>£{Number(listing.price).toLocaleString("en-GB")}</td>
                    <td>
                      {listing.taken_down_at ? (
                        <>
                          <Badge tone="danger">Taken down</Badge>
                          <div className="ha-sub" style={{ marginTop: 4, maxWidth: 260 }}>
                            {formatWhen(listing.taken_down_at)}{listing.takedown_reason ? ` — ${listing.takedown_reason}` : ""}
                          </div>
                        </>
                      ) : (
                        <Badge tone={STATUS_TONE[listing.status] ?? "neutral"}>{listing.status.replace(/_/g, " ")}</Badge>
                      )}
                    </td>
                    <td>
                      <div className="ha-actions">
                        <Link href={`/admin/listings/${listing.id}`} className="ha-btn is-sm">View</Link>
                        {listing.taken_down_at ? (
                          <JustifiedAction label="Restore" title="Restore listing" description={`${listing.title} — the seller will be able to relist it.`} path={`/admin/listings/${listing.id}/restore`} primary onDone={reload} />
                        ) : listing.status === "sold" ? (
                          <span className="ha-sub">Sold</span>
                        ) : (
                          <JustifiedAction label="Take down" title="Take listing down" description={`${listing.title} will be withdrawn and the seller blocked from relisting it.`} path={`/admin/listings/${listing.id}/takedown`} fourEyes danger onDone={reload} />
                        )}
                      </div>
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
