"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useDealerGroup, useGroupAds, type GroupDealership } from "@/hooks/useDealerGroup";
import { pageInfo } from "@/lib/superAdmin";
import DashboardPage from "@/components/dashboard/DashboardPage";
import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  ErrorNotice,
  LoadingRows,
  LoadingTable,
  Notice,
  Pager,
  StatCard,
  Stats,
  StatusBadge,
  formatMoney,
} from "@/components/ui/kit";

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
    <Card className="mb-4" title="Open a new dealership" description="It joins your group with its own public page. Give it an Org Admin who then sets up rooftops and staff. KYB starts as pending.">
      <form onSubmit={submit} className="ha-card-body">
        <div className="ha-form-grid">
          <div className="ha-field">
            <label htmlFor="og-name">Dealership name</label>
            <input id="og-name" className="ha-input" value={form.name} onChange={set("name")} required />
          </div>
          <div className="ha-field">
            <label htmlFor="og-admin-name">Org Admin&apos;s full name</label>
            <input id="og-admin-name" className="ha-input" value={form.admin_name} onChange={set("admin_name")} required autoComplete="off" />
          </div>
          <div className="ha-field">
            <label htmlFor="og-admin-email">Org Admin&apos;s email</label>
            <input id="og-admin-email" type="email" className="ha-input" value={form.admin_email} onChange={set("admin_email")} required autoComplete="off" />
          </div>
          <div className="ha-field">
            <label htmlFor="og-password">Initial password</label>
            <input id="og-password" type="password" className="ha-input" value={form.admin_password} onChange={set("admin_password")} required autoComplete="new-password" />
          </div>
          <div className="ha-field">
            <label htmlFor="og-password-confirm">Confirm password</label>
            <input id="og-password-confirm" type="password" className="ha-input" value={form.admin_password_confirmation} onChange={set("admin_password_confirmation")} required autoComplete="new-password" />
          </div>
        </div>
        {error && <Notice tone="danger">{error}</Notice>}
        {done && <Notice tone="success">Dealership opened. Share the initial password with its Org Admin.</Notice>}
        <button type="submit" className="ha-btn is-primary" disabled={busy} aria-busy={busy}>
          {busy ? "Opening…" : "Open dealership"}
        </button>
      </form>
    </Card>
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
    <form onSubmit={submit} className="ha-inline-edit mt-3" aria-label={`New Org Admin for ${dealership.name}`}>
      <div className="ha-primary-text mb-2">New Org Admin for {dealership.name}</div>
      <input className="ha-input mb-2" placeholder="Full name" aria-label="Full name" value={form.name} onChange={set("name")} required />
      <input type="email" className="ha-input mb-2" placeholder="Email" aria-label="Email" value={form.email} onChange={set("email")} required />
      <input type="password" className="ha-input mb-2" placeholder="Initial password" aria-label="Initial password" value={form.password} onChange={set("password")} required autoComplete="new-password" />
      <input type="password" className="ha-input mb-3" placeholder="Confirm password" aria-label="Confirm password" value={form.password_confirmation} onChange={set("password_confirmation")} required autoComplete="new-password" />
      {error && <Notice tone="danger">{error}</Notice>}
      <div className="ha-actions is-start">
        <button type="submit" className="ha-btn is-sm is-primary">Appoint</button>
        <button type="button" className="ha-btn is-sm is-ghost" onClick={onClose}>Cancel</button>
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

  const dealershipName = overview?.dealerships.find((d) => String(d.id) === organizationId)?.name;
  const STATUS_LABELS: Record<string, string> = { live: "Live", pending_checks: "Awaiting review", draft: "Draft", sold: "Sold" };
  const filtered = organizationId !== "" || status !== "" || q.trim() !== "";

  return (
    <DashboardPage
      eyebrow="Dealer group"
      title={overview ? overview.group.name : "Dealer group"}
      description="Your dealerships, their stock and their Org Admins in one place. Each dealership still manages its own ads, rooftops and staff."
    >
      {loading && <LoadingRows rows={4} label="Loading your group" />}
      {error && <Notice tone="danger">{error}</Notice>}

      {overview && (
        <>
          <Stats>
            <StatCard label="Dealerships" icon="icon-carus-usercheck" value={overview.totals.dealerships} />
            <StatCard label="Rooftops" icon="icon-carus-mappinline" value={overview.totals.rooftops} />
            <StatCard label="Staff" icon="icon-carus-user" value={overview.totals.staff} />
            <StatCard label="Live ads" icon="icon-carus-car" value={overview.totals.live_ads} />
            <StatCard
              label="Awaiting review"
              icon="icon-carus-pending"
              value={overview.totals.awaiting_review}
              attention={overview.totals.awaiting_review > 0}
              note={overview.totals.awaiting_review > 0 ? "With moderators" : undefined}
            />
          </Stats>

          <h2 className="hd-section-title" style={{ marginTop: 0 }}>Dealerships</h2>
          <div className="ha-grid mb-4">
            {overview.dealerships.map((d) => (
              <section key={d.id} className="ha-card ha-card-body" aria-label={d.name}>
                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <h3 className="hd-card-title mb-0">{d.name}</h3>
                  <StatusBadge status={d.status} />
                </div>
                <div className="ha-chips mb-3">
                  <Badge tone={d.kyb_status === "verified" ? "success" : "warning"} plain>
                    KYB {d.kyb_status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <dl className="ha-dl mb-3" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                  <div>
                    <dt>Live ads</dt>
                    <dd className="ha-num">
                      {d.live_ads_count}
                      {d.awaiting_review_count > 0 && <span className="ha-sub"> +{d.awaiting_review_count} in review</span>}
                    </dd>
                  </div>
                  <div>
                    <dt>Rooftops</dt>
                    <dd className="ha-num">{d.rooftops_count}</dd>
                  </div>
                  <div>
                    <dt>Staff</dt>
                    <dd className="ha-num">{d.staff_count}</dd>
                  </div>
                </dl>
                <div className="ha-sub mb-3">
                  Org Admin{d.org_admins.length === 1 ? "" : "s"}: {d.org_admins.length === 0 ? <span className="ha-inline-error">none</span> : d.org_admins.map((a) => a.name).join(", ")}
                </div>
                <div className="ha-actions is-start">
                  <button type="button" className="ha-btn is-sm" onClick={() => setOrganizationId(String(d.id))}>
                    View its ads
                  </button>
                  <button type="button" className="ha-btn is-sm" aria-expanded={appointing === d.id} onClick={() => setAppointing(appointing === d.id ? null : d.id)}>
                    Add Org Admin
                  </button>
                  {d.storefront_slug && (
                    <Link href={`/dealer-detail/${d.storefront_slug}`} className="ha-btn is-sm is-ghost">
                      Public page
                    </Link>
                  )}
                </div>
                {appointing === d.id && <AppointAdmin dealership={d} onAppoint={appointAdmin} onClose={() => setAppointing(null)} />}
              </section>
            ))}
          </div>

          <OpenDealership onOpen={openDealership} />

          <Card title="Group-wide ads">
            <div className="ha-toolbar">
              <div className="ha-search" role="search">
                <i className="icon-carus-search" aria-hidden="true" />
                <input className="ha-input" type="search" placeholder="Make, model or VRM" aria-label="Search ads" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
              </div>
              <select className="ha-select ha-inline-select" aria-label="Dealership" value={organizationId} onChange={(e) => { setOrganizationId(e.target.value); setPage(1); }}>
                <option value="">All dealerships</option>
                {overview.dealerships.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select className="ha-select ha-inline-select" aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                <option value="">Any status</option>
                <option value="live">Live</option>
                <option value="pending_checks">Awaiting review</option>
                <option value="draft">Draft</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            {filtered && (
              <div className="ha-filterbar" aria-label="Active filters">
                {q.trim() !== "" && (
                  <span className="ha-chip">
                    “{q.trim()}”
                    <button type="button" aria-label="Clear search" onClick={() => { setQ(""); setPage(1); }}>×</button>
                  </span>
                )}
                {organizationId !== "" && (
                  <span className="ha-chip">
                    Dealership: {dealershipName ?? organizationId}
                    <button type="button" aria-label="Remove dealership filter" onClick={() => { setOrganizationId(""); setPage(1); }}>×</button>
                  </span>
                )}
                {status !== "" && (
                  <span className="ha-chip">
                    Status: {STATUS_LABELS[status] ?? status}
                    <button type="button" aria-label="Remove status filter" onClick={() => { setStatus(""); setPage(1); }}>×</button>
                  </span>
                )}
                <button type="button" className="ha-link-btn" onClick={() => { setQ(""); setOrganizationId(""); setStatus(""); setPage(1); }}>
                  Clear all
                </button>
              </div>
            )}
            {adsLoading && !ads && <LoadingTable label="Loading ads" columns={5} />}
            {adsError && <ErrorNotice message={adsError} />}
            {ads && ads.data.length === 0 && <EmptyState icon="icon-carus-search" title="No ads match" text="Try a different dealership, status or search." />}
            {ads && ads.data.length > 0 && (
              <DataTable caption="Group-wide ads">
                <thead>
                  <tr>
                    <th scope="col">Ad</th>
                    <th scope="col">Dealership</th>
                    <th scope="col">Rooftop</th>
                    <th scope="col" className="is-num">Price</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ads.data.map((ad) => (
                    <tr key={ad.id}>
                      <td data-label="Ad">
                        <Link href={`/listing-detail-v1/${ad.id}`} className="ha-primary-text">
                          {ad.title || "Ad"}
                        </Link>
                        {ad.vrm && <div className="ha-sub">{ad.vrm}</div>}
                      </td>
                      <td data-label="Dealership">{ad.dealership ?? "—"}</td>
                      <td data-label="Rooftop">{ad.rooftop ?? <span className="ha-muted">Whole dealership</span>}</td>
                      <td data-label="Price" className="is-num">{formatMoney(Number(ad.price))}</td>
                      <td data-label="Status">
                        <StatusBadge status={ad.status} label={STATUS_LABELS[ad.status]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}
            {info && <Pager page={info.page} lastPage={info.lastPage} total={info.total} onChange={setPage} />}
          </Card>
        </>
      )}
    </DashboardPage>
  );
}
