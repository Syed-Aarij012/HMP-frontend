"use client";

import { useState } from "react";
import Link from "next/link";
import { NEXT_STATUSES, useLeads, type Lead, type LeadStatus } from "@/hooks/useLeads";
import DashboardPage from "@/components/dashboard/DashboardPage";
import {
  Badge,
  Card,
  DataTable,
  DataToolbar,
  EmptyState,
  ErrorNotice,
  LoadingTable,
  NoMatches,
  Notice,
  Pager,
  StatusBadge,
  Tabs,
  useListControls,
  type Tone,
} from "@/components/ui/kit";

const SOURCE_LABELS: Record<string, string> = { offer: "Offer", message: "Message", test_drive: "Test drive" };
const STATUS_TONE: Record<LeadStatus, Tone> = {
  new: "primary",
  contacted: "warning",
  converted: "success",
  lost: "neutral",
};
const STATUS_TABS = ["new", "contacted", "converted", "lost", "all"] as const;
const ACTION_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Mark contacted",
  converted: "Mark converted",
  lost: "Mark lost",
};

const pounds = (value: string | number) => `£${Math.round(Number(value)).toLocaleString("en-GB")}`;
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

function OfferCell({ offer }: { offer: Lead["offer"] }) {
  if (!offer) return <>-</>;
  const range = offer.part_exchange_appraisal?.trade_in_range;

  return (
    <>
      <span className="ha-num">{pounds(offer.amount)}</span> <StatusBadge status={offer.status} />
      {offer.part_exchange_appraisal && (
        <div className="ha-sub">
          + part-exchange {range ? `${pounds(range.low)}–${pounds(range.high)}` : "(to be appraised)"} at{" "}
          {offer.part_exchange_appraisal.mileage.toLocaleString("en-GB")} mi
        </div>
      )}
    </>
  );
}

/**
 * FR-C-032 / P3 "lead inbox": every buyer enquiry about the dealer's stock — offers,
 * messages and test-drive bookings — as routed by the org's lead routing rules, with the
 * new → contacted → converted/lost workflow.
 */
export default function Dashboard() {
  const [status, setStatus] = useState<LeadStatus | "all">("new");
  const [page, setPage] = useState(1);
  const { leads, lastPage, total, loading, error, actionError, busyId, updateStatus, isDealer, isOrgAdmin } = useLeads(status, page);

  const controls = useListControls<Lead>({
    items: leads,
    search: (lead) => [lead.listing.title, lead.buyer?.name, lead.routed_to?.name],
    filters: [{ key: "source", label: "Source", get: (lead) => lead.source, format: (value) => SOURCE_LABELS[value] ?? value }],
    sorts: [
      { value: "newest", label: "Newest first", compare: (a, b) => b.created_at.localeCompare(a.created_at) },
      { value: "oldest", label: "Oldest first", compare: (a, b) => a.created_at.localeCompare(b.created_at) },
    ],
  });

  return (
    <DashboardPage
      title="Leads"
      description={isDealer ? (isOrgAdmin ? "Every buyer enquiry across your organisation — offers, messages and test drives." : "Buyer enquiries routed to you — offers, messages and test drives.") : undefined}
    >
      {!isDealer && (
        <Card>
          <EmptyState icon="icon-carus-chattext" title="Dealer accounts only" text="The lead inbox is for dealer accounts only." />
        </Card>
      )}

      {isDealer && (
        <>
          {actionError && <Notice tone="danger">{actionError}</Notice>}
          <div className="mb-3">
            <Tabs
              label="Lead status"
              value={status}
              options={STATUS_TABS}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            />
          </div>

          <Card>
            {loading && <LoadingTable label="Loading leads" columns={6} />}
            {error && <ErrorNotice message={error} />}
            {!loading && !error && leads.length === 0 && (
              <EmptyState icon="icon-carus-chattext" title="No leads here" text={status === "all" ? "Buyer enquiries about your stock will appear here." : `No ${status} leads right now.`} />
            )}

            {leads.length > 0 && (
              <>
                <DataToolbar controls={controls} searchPlaceholder="Search vehicle, buyer or assignee" noun="lead" />
                {controls.results.length === 0 ? (
                  <NoMatches onClear={controls.clearAll} />
                ) : (
                  <DataTable caption="Leads">
                    <thead>
                      <tr>
                        <th scope="col">Received</th>
                        <th scope="col">Vehicle</th>
                        <th scope="col">Buyer</th>
                        <th scope="col">Source</th>
                        <th scope="col">Offer</th>
                        {isOrgAdmin && <th scope="col">Assigned to</th>}
                        <th scope="col">Status</th>
                        <th scope="col">
                          <span className="ha-visually-hidden">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {controls.results.map((lead) => (
                        <tr key={lead.id}>
                          <td data-label="Received" className="ha-num" style={{ whiteSpace: "nowrap" }}>
                            {when(lead.created_at)}
                          </td>
                          <td data-label="Vehicle">
                            <Link href={`/listing-detail-v1/${lead.listing.id}`} className="ha-primary-text">
                              {lead.listing.title ?? "Listing"}
                            </Link>
                            <div className="ha-sub">
                              {pounds(lead.listing.price)} · <span className="text-capitalize">{lead.listing.status.replace(/_/g, " ")}</span>
                            </div>
                          </td>
                          <td data-label="Buyer">{lead.buyer?.name ?? "—"}</td>
                          <td data-label="Source">{SOURCE_LABELS[lead.source ?? ""] ?? lead.source ?? "—"}</td>
                          <td data-label="Offer">
                            <OfferCell offer={lead.offer} />
                          </td>
                          {isOrgAdmin && <td data-label="Assigned to">{lead.routed_to?.name ?? <span className="ha-muted">Unassigned</span>}</td>}
                          <td data-label="Status">
                            <Badge tone={STATUS_TONE[lead.status]}>{lead.status}</Badge>
                          </td>
                          <td data-label="">
                            <div className="ha-row-actions">
                              {NEXT_STATUSES[lead.status].map((next, index) => (
                                <button
                                  key={next}
                                  type="button"
                                  className={`ha-btn is-sm${index === 0 ? " is-primary" : ""}`}
                                  disabled={busyId === lead.id}
                                  onClick={() => updateStatus(lead.id, next)}
                                >
                                  {lead.status === "lost" && next === "contacted" ? "Reopen" : ACTION_LABELS[next]}
                                </button>
                              ))}
                              {lead.conversation_id && (
                                <Link href={`/message?conversation=${lead.conversation_id}`} className="ha-btn is-sm is-ghost">
                                  Message
                                </Link>
                              )}
                              {lead.offer && (
                                <Link href="/my-offers" className="ha-btn is-sm is-ghost">
                                  Offer
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </DataTable>
                )}
              </>
            )}
            <Pager page={page} lastPage={lastPage} total={total} onChange={setPage} />
          </Card>
        </>
      )}
    </DashboardPage>
  );
}
