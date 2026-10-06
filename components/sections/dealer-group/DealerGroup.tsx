"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useDealerGroup, useGroupAds, type GroupDealership } from "@/hooks/useDealerGroup";
import { pageInfo } from "@/lib/superAdmin";

const EMPTY = { name: "", admin_name: "", admin_email: "", admin_password: "", admin_password_confirmation: "" };

function OpenDealership({ onOpen }: { onOpen: (body: Record<string, unknown>) => Promise<{ ok: boolean; message?: string }> }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setDone(false);
    const result = await onOpen(form);
    setBusy(false);
    if (result.ok) {
      setForm(EMPTY);
      setDone(true);
    } else {
      setError(result.message ?? "Could not open that dealership.");
    }
  }

  return (
    <form onSubmit={submit} className="tfcl-card p-3 mb-4">
      <h4 className="mb-1">Open a new dealership</h4>
      <p className="text-color-2 fs-13 mb-3">It joins your group with its own public page. Give it an Org Admin who then sets up rooftops and staff. KYB starts as pending.</p>
      <div className="row">
        <div className="col-md-6 mb-2"><input className="form-control" placeholder="Dealership name" aria-label="Dealership name" value={form.name} onChange={set("name")} required /></div>
        <div className="col-md-6 mb-2"><input className="form-control" placeholder="Org Admin's full name" aria-label="Org Admin name" value={form.admin_name} onChange={set("admin_name")} required /></div>
        <div className="col-md-6 mb-2"><input type="email" className="form-control" placeholder="Org Admin's email" aria-label="Org Admin email" value={form.admin_email} onChange={set("admin_email")} required /></div>
        <div className="col-md-3 mb-2"><input type="password" className="form-control" placeholder="Initial password" aria-label="Initial password" value={form.admin_password} onChange={set("admin_password")} required autoComplete="new-password" /></div>
        <div className="col-md-3 mb-2"><input type="password" className="form-control" placeholder="Confirm" aria-label="Confirm password" value={form.admin_password_confirmation} onChange={set("admin_password_confirmation")} required autoComplete="new-password" /></div>
      </div>
      {error && <div className="alert alert-danger py-1">{error}</div>}
      {done && <div className="text-success fs-13 mb-2">Dealership opened. Share the initial password with its Org Admin.</div>}
      <button type="submit" className="sc-button" disabled={busy}><span>{busy ? "Opening..." : "Open dealership"}</span></button>
    </form>
  );
}

function AppointAdmin({ dealership, onAppoint, onClose }: {
  dealership: GroupDealership;
  onAppoint: (organizationId: number, body: Record<string, unknown>) => Promise<{ ok: boolean; message?: string }>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await onAppoint(dealership.id, form);
    if (result.ok) onClose();
    else setError(result.message ?? "Could not appoint that Org Admin.");
  }

  return (
    <form onSubmit={submit} className="mt-2 p-2" style={{ background: "#F4F6FB", borderRadius: 8 }}>
      <div className="fs-13 fw-bold mb-1">New Org Admin for {dealership.name}</div>
      <input className="form-control mb-1" placeholder="Full name" aria-label="Name" value={form.name} onChange={set("name")} required />
      <input type="email" className="form-control mb-1" placeholder="Email" aria-label="Email" value={form.email} onChange={set("email")} required />
      <input type="password" className="form-control mb-1" placeholder="Initial password" aria-label="Password" value={form.password} onChange={set("password")} required autoComplete="new-password" />
      <input type="password" className="form-control mb-2" placeholder="Confirm password" aria-label="Confirm password" value={form.password_confirmation} onChange={set("password_confirmation")} required autoComplete="new-password" />
      {error && <div className="alert alert-danger py-1">{error}</div>}
      <div className="d-flex gap-2">
        <button type="submit" className="sc-button"><span>Appoint</span></button>
        <button type="button" className="sc-button" onClick={onClose}><span>Cancel</span></button>
      </div>
    </form>
  );
}

/**
 * REQ RBAC-003 "dealership group → rooftop → user": the Group Admin's dashboard — every
 * dealership in the group, the group-wide stock, and opening a new dealership.
 */
export default function DealerGroup() {
  const { overview, loading, error, openDealership, appointAdmin } = useDealerGroup();
  const [organizationId, setOrganizationId] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [appointing, setAppointing] = useState<number | null>(null);
  const { ads, loading: adsLoading, error: adsError } = useGroupAds(organizationId, status, q, page);
  const info = ads ? pageInfo(ads) : null;

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-1">{overview ? overview.group.name : "Dealer group"}</h1>
                  <p className="text-color-2 mb-3">Your dealerships, their stock and their Org Admins in one place. Each dealership still manages its own ads, rooftops and staff.</p>

                  {loading && <p>Loading your group...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}

                  {overview && (
                    <>
                      <div className="row mb-3">
                        {[
                          ["Dealerships", overview.totals.dealerships],
                          ["Rooftops", overview.totals.rooftops],
                          ["Staff", overview.totals.staff],
                          ["Live ads", overview.totals.live_ads],
                          ["Awaiting review", overview.totals.awaiting_review],
                        ].map(([label, value]) => (
                          <div key={label} className="col-6 col-md-4 col-xl mb-2">
                            <div className="tfcl-card p-3">
                              <div className="text-color-2 fs-13">{label}</div>
                              <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="row mb-2">
                        {overview.dealerships.map((d) => (
                          <div key={d.id} className="col-md-6 col-xl-4 mb-3">
                            <div className="tfcl-card p-3 h-100">
                              <h5 className="mb-1">{d.name}</h5>
                              <div className="fs-13 text-color-2 mb-2">
                                KYB {d.kyb_status} · {d.status}
                              </div>
                              <div className="fs-14 mb-2">
                                {d.live_ads_count} live ads{d.awaiting_review_count > 0 ? ` (+${d.awaiting_review_count} awaiting review)` : ""} · {d.rooftops_count} rooftop{d.rooftops_count === 1 ? "" : "s"} · {d.staff_count} staff
                              </div>
                              <div className="fs-13 mb-2">
                                <b>Org Admin{d.org_admins.length === 1 ? "" : "s"}:</b>{" "}
                                {d.org_admins.length === 0 ? "none" : d.org_admins.map((a) => a.name).join(", ")}
                              </div>
                              <div className="d-flex flex-wrap gap-2">
                                {d.storefront_slug && (
                                  <Link href={`/dealer-detail/${d.storefront_slug}`} className="sc-button"><span>Public page</span></Link>
                                )}
                                <button type="button" className="sc-button" onClick={() => setOrganizationId(String(d.id))}><span>View its ads</span></button>
                                <button type="button" className="sc-button" onClick={() => setAppointing(appointing === d.id ? null : d.id)}><span>Add Org Admin</span></button>
                              </div>
                              {appointing === d.id && <AppointAdmin dealership={d} onAppoint={appointAdmin} onClose={() => setAppointing(null)} />}
                            </div>
                          </div>
                        ))}
                      </div>

                      <OpenDealership onOpen={openDealership} />

                      <h4 className="mb-2">Group-wide ads</h4>
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        <select className="form-control" style={{ maxWidth: 240 }} aria-label="Dealership" value={organizationId} onChange={(e) => { setOrganizationId(e.target.value); setPage(1); }}>
                          <option value="">All dealerships</option>
                          {overview.dealerships.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <select className="form-control" style={{ maxWidth: 180 }} aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                          <option value="">Any status</option>
                          <option value="live">Live</option>
                          <option value="pending_checks">Awaiting review</option>
                          <option value="draft">Draft</option>
                          <option value="sold">Sold</option>
                        </select>
                        <input className="form-control" style={{ maxWidth: 240 }} placeholder="Make, model or VRM" aria-label="Search ads" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
                      </div>
                      {adsLoading && !ads && <p>Loading ads...</p>}
                      {adsError && <div className="alert alert-danger">{adsError}</div>}
                      {ads && ads.data.length === 0 && <p className="tfcl-empty-data">No ads match.</p>}
                      {ads && ads.data.length > 0 && (
                        <div className="table-responsive">
                          <table className="table">
                            <thead>
                              <tr><th>Ad</th><th>Dealership</th><th>Rooftop</th><th>Price</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                              {ads.data.map((ad) => (
                                <tr key={ad.id}>
                                  <td><Link href={`/listing-detail-v1/${ad.id}`}>{ad.title || "Ad"}</Link><div className="fs-13 text-color-2">{ad.vrm ?? ""}</div></td>
                                  <td>{ad.dealership ?? "-"}</td>
                                  <td>{ad.rooftop ?? "Whole dealership"}</td>
                                  <td>£{Number(ad.price).toLocaleString("en-GB")}</td>
                                  <td className="text-capitalize">{ad.status.replace(/_/g, " ")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {info && info.lastPage > 1 && (
                        <div className="d-flex gap-2 align-items-center">
                          <button type="button" className="sc-button" disabled={info.page <= 1} onClick={() => setPage(info.page - 1)}><span>Previous</span></button>
                          <span className="fs-13">Page {info.page} of {info.lastPage}</span>
                          <button type="button" className="sc-button" disabled={info.page >= info.lastPage} onClick={() => setPage(info.page + 1)}><span>Next</span></button>
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
