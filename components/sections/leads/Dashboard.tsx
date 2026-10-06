"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { NEXT_STATUSES, useLeads, type Lead, type LeadStatus } from "@/hooks/useLeads";

const SOURCE_LABELS: Record<string, string> = { offer: "Offer", message: "Message", test_drive: "Test drive" };
const STATUS_CLASS: Record<LeadStatus, string> = {
  new: "bg-primary",
  contacted: "bg-info text-dark",
  converted: "bg-success",
  lost: "bg-secondary",
};
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
      {pounds(offer.amount)} <span className="text-color-2 text-capitalize">({offer.status})</span>
      {offer.part_exchange_appraisal && (
        <div className="fs-13 text-color-2">
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

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-1">Leads</h1>
                  {isDealer && (
                    <p className="text-color-2 mb-3">
                      {isOrgAdmin ? "Every lead across your organization." : "Leads routed to you."}
                    </p>
                  )}

                  {!isDealer && <p className="tfcl-empty-data">The lead inbox is for dealer accounts only.</p>}

                  {isDealer && (
                    <>
                      <div className="flex gap-10 align-center mb-3" style={{ flexWrap: "wrap" }}>
                        <label htmlFor="lead-status" className="mb-0">
                          Show
                        </label>
                        <select
                          id="lead-status"
                          className="form-control"
                          style={{ maxWidth: 200 }}
                          value={status}
                          onChange={(e) => {
                            setStatus(e.target.value as LeadStatus | "all");
                            setPage(1);
                          }}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="lost">Lost</option>
                          <option value="all">All</option>
                        </select>
                        <span className="text-color-2">{total} lead(s)</span>
                      </div>

                      {loading && <p>Loading leads...</p>}
                      {error && <div className="alert alert-danger">{error}</div>}
                      {actionError && <div className="alert alert-danger">{actionError}</div>}
                      {!loading && !error && leads.length === 0 && <p className="tfcl-empty-data">No leads here.</p>}

                      {leads.length > 0 && (
                        <div className="table-responsive">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Received</th>
                                <th>Vehicle</th>
                                <th>Buyer</th>
                                <th>Source</th>
                                <th>Offer</th>
                                {isOrgAdmin && <th>Assigned to</th>}
                                <th>Status</th>
                                <th />
                              </tr>
                            </thead>
                            <tbody>
                              {leads.map((lead) => (
                                <tr key={lead.id}>
                                  <td>{when(lead.created_at)}</td>
                                  <td>
                                    <Link href={`/listing-detail-v1/${lead.listing.id}`}>{lead.listing.title ?? "Listing"}</Link>
                                    <div className="fs-13 text-color-2">
                                      {pounds(lead.listing.price)} · <span className="text-capitalize">{lead.listing.status}</span>
                                    </div>
                                  </td>
                                  <td>{lead.buyer?.name ?? "-"}</td>
                                  <td>{SOURCE_LABELS[lead.source ?? ""] ?? lead.source ?? "-"}</td>
                                  <td>
                                    <OfferCell offer={lead.offer} />
                                  </td>
                                  {isOrgAdmin && <td>{lead.routed_to?.name ?? <span className="text-color-2">Unassigned</span>}</td>}
                                  <td>
                                    <span className={`badge ${STATUS_CLASS[lead.status]} text-capitalize`}>{lead.status}</span>
                                  </td>
                                  <td>
                                    <div className="flex gap-8" style={{ flexWrap: "wrap" }}>
                                      {lead.conversation_id && (
                                        <Link href={`/message?conversation=${lead.conversation_id}`} className="sc-button">
                                          <span>Message</span>
                                        </Link>
                                      )}
                                      {lead.offer && (
                                        <Link href="/my-offers" className="sc-button">
                                          <span>Offer</span>
                                        </Link>
                                      )}
                                      {NEXT_STATUSES[lead.status].map((next) => (
                                        <button
                                          key={next}
                                          type="button"
                                          className="sc-button"
                                          disabled={busyId === lead.id}
                                          onClick={() => updateStatus(lead.id, next)}
                                        >
                                          <span>{lead.status === "lost" && next === "contacted" ? "Reopen" : ACTION_LABELS[next]}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {lastPage > 1 && (
                        <div className="flex gap-10 align-center">
                          <button type="button" className="sc-button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                            <span>Previous</span>
                          </button>
                          <span>
                            Page {page} of {lastPage}
                          </span>
                          <button type="button" className="sc-button" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>
                            <span>Next</span>
                          </button>
                        </div>
                      )}
                    </>
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
