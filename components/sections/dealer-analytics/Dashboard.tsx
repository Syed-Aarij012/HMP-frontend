"use client";

import { useState, type FormEvent } from "react";
import { useAdCampaigns } from "@/hooks/useAdCampaigns";
import { useDealerAnalytics } from "@/hooks/useDealerAnalytics";
import { useMyListings } from "@/hooks/useMyListings";
import DealerAnalyticsChart from "./DealerAnalyticsChart";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Badge, Card, DataTable, EmptyState, LoadingRows, Notice, StatCard, Stats, StatusBadge, formatMoney } from "@/components/ui/kit";

const pct = (rate: number | null) => (rate !== null ? `${(rate * 100).toFixed(1)}%` : "—");

function AdCampaignsPanel() {
  const { products, campaigns, loading, error, actionError, submitting, launch, setStatus } = useAdCampaigns();
  const { listings } = useMyListings();
  const liveListings = listings.filter((listing) => listing.rawStatus === "live" && listing.publicId);
  const [productId, setProductId] = useState("");
  const [listingId, setListingId] = useState("");
  const [targetMake, setTargetMake] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const selectedProduct = products.find((product) => product.id === Number(productId));
  const isModelPage = selectedProduct?.type === "model_page_sponsorship";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!productId || !startsAt || !endsAt) return;

    const ok = await launch({
      adProductId: Number(productId),
      listingId: isModelPage ? undefined : listingId,
      targetMake: isModelPage ? targetMake : undefined,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
    });

    if (ok) {
      setListingId("");
      setTargetMake("");
    }
  }

  if (loading) return <LoadingRows rows={3} label="Loading your ad campaigns" />;
  if (error) return <Notice tone="danger">{error}</Notice>;

  return (
    <Card title="Ad campaigns" description="Promote a live listing or sponsor a make's model page.">
      {actionError && (
        <div className="ha-card-body" style={{ paddingBottom: 0 }}>
          <Notice tone="danger">{actionError}</Notice>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ha-card-body" aria-label="Launch a campaign" style={{ borderBottom: "1px solid var(--hmp-border)" }}>
        <div className="ha-form-grid">
          <div className="ha-field">
            <label htmlFor="ad-product">Ad product</label>
            <select id="ad-product" className="ha-select" value={productId} onChange={(e) => setProductId(e.target.value)} required>
              <option value="">Choose...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({formatMoney(product.price)})
                </option>
              ))}
            </select>
          </div>
          {isModelPage ? (
            <div className="ha-field">
              <label htmlFor="ad-target-make">Target make</label>
              <input id="ad-target-make" type="text" className="ha-input" value={targetMake} onChange={(e) => setTargetMake(e.target.value)} placeholder="e.g. Volvo" />
            </div>
          ) : (
            <div className="ha-field">
              <label htmlFor="ad-listing">Listing to promote</label>
              <select id="ad-listing" className="ha-select" value={listingId} onChange={(e) => setListingId(e.target.value)}>
                <option value="">Choose a live listing...</option>
                {liveListings.map((listing) => (
                  <option key={listing.publicId} value={listing.publicId}>
                    {listing.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="ha-field">
            <label htmlFor="ad-starts">Starts</label>
            <input id="ad-starts" type="datetime-local" className="ha-input" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
          </div>
          <div className="ha-field">
            <label htmlFor="ad-ends">Ends</label>
            <input id="ad-ends" type="datetime-local" className="ha-input" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
          </div>
        </div>
        <button type="submit" className="ha-btn is-primary" disabled={submitting || !productId}>{submitting ? "Launching…" : "Launch campaign"}</button>
      </form>

      {campaigns.length === 0 && <EmptyState icon="icon-carus-sliders" title="No campaigns yet" text="Campaigns you launch appear here with their performance." />}

      {campaigns.length > 0 && (
        <DataTable caption="Your ad campaigns">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Status</th>
                <th scope="col" className="is-num">Impressions</th>
                <th scope="col" className="is-num">Clicks</th>
                <th scope="col" className="is-num">Leads</th>
                <th scope="col" className="is-num">CTR</th>
                <th scope="col"><span className="ha-visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td data-label="Product" className="ha-primary-text">{campaign.product.name}</td>
                  <td data-label="Status">
                    <div className="ha-chips">
                      <StatusBadge status={campaign.status} />
                      {campaign.running && <Badge tone="success" plain>Live now</Badge>}
                    </div>
                  </td>
                  <td data-label="Impressions" className="is-num">{campaign.impressions.toLocaleString("en-GB")}</td>
                  <td data-label="Clicks" className="is-num">{campaign.clicks.toLocaleString("en-GB")}</td>
                  <td data-label="Leads" className="is-num">{campaign.leads.toLocaleString("en-GB")}</td>
                  <td data-label="CTR" className="is-num">{pct(campaign.clickThroughRate)}</td>
                  <td data-label=""><div className="ha-row-actions">
                    {campaign.status === "active" && (
                      <button type="button" className="ha-btn is-sm" onClick={() => setStatus(campaign.id, "paused")}>
                        Pause
                      </button>
                    )}
                    {campaign.status === "paused" && (
                      <button type="button" className="ha-btn is-sm" onClick={() => setStatus(campaign.id, "active")}>
                        Resume
                      </button>
                    )}
                    {campaign.status !== "ended" && (
                      <button type="button" className="ha-btn is-sm is-danger" onClick={() => setStatus(campaign.id, "ended")}>
                        End
                      </button>
                    )}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </DataTable>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { analytics, loading, error, isDealer } = useDealerAnalytics(30);

  return (
    <DashboardPage title="Dealer analytics" description={isDealer ? "How your stock is performing over the last 30 days." : undefined}>
      {!isDealer && (
        <Card>
          <EmptyState icon="icon-carus-checkcircle" title="Dealer accounts only" text="This page is for dealer accounts only." />
        </Card>
      )}
      {isDealer && loading && <LoadingRows rows={4} label="Loading your analytics" />}
      {isDealer && error && <Notice tone="danger">{error}</Notice>}

      {analytics && (
        <>
          <Stats>
            <StatCard label="Active listings" icon="icon-carus-car" value={analytics.activeListingsCount.toLocaleString("en-GB")} />
            <StatCard label="Search impressions" icon="icon-carus-search" value={analytics.searchImpressions.toLocaleString("en-GB")} note={`Last ${analytics.periodDays} days`} />
            <StatCard label="Detail views" icon="icon-carus-listings" value={analytics.periodDetailViews.toLocaleString("en-GB")} note={`Last ${analytics.periodDays} days`} />
            <StatCard label="Avg days to sell" icon="icon-carus-clock" value={analytics.averageDaysToSell !== null ? String(analytics.averageDaysToSell) : "—"} />
          </Stats>

          <Card className="mb-4" title={`Activity, last ${analytics.periodDays} days`}>
            <div className="ha-card-body">
              <DealerAnalyticsChart series={analytics.series} />
            </div>
          </Card>

          <div className="ha-grid is-2 mb-4">
            <Card title="Leads">
              <div className="ha-card-body">
                <dl className="ha-dl">
                  <div>
                    <dt>Total</dt>
                    <dd className="ha-num">{analytics.leads.total}</dd>
                  </div>
                  <div>
                    <dt>Converted</dt>
                    <dd className="ha-num">{analytics.leads.conversionRate !== null ? pct(analytics.leads.conversionRate) : "No conversions yet"}</dd>
                  </div>
                </dl>
                <p className="ha-sub mt-3 mb-0">
                  New {analytics.leads.byStatus.new} · Contacted {analytics.leads.byStatus.contacted} · Converted {analytics.leads.byStatus.converted} · Lost{" "}
                  {analytics.leads.byStatus.lost}
                </p>
              </div>
            </Card>

            {/* FR-C-033 no-show tracking. */}
            <Card title={`Test drives, last ${analytics.periodDays} days`}>
              <div className="ha-card-body">
                <dl className="ha-dl">
                  <div>
                    <dt>No-show rate</dt>
                    <dd className="ha-num">{analytics.appointments.noShowRate !== null ? pct(analytics.appointments.noShowRate) : "No completed or missed test drives yet"}</dd>
                  </div>
                </dl>
                <p className="ha-sub mt-3 mb-0">
                  Booked {analytics.appointments.booked} · Completed {analytics.appointments.completed} · No-show {analytics.appointments.noShow} · Cancelled{" "}
                  {analytics.appointments.cancelled}
                </p>
              </div>
            </Card>
          </div>

          <AdCampaignsPanel />
        </>
      )}
    </DashboardPage>
  );
}
