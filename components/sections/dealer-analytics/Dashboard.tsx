"use client";

import { useState, type FormEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useAdCampaigns } from "@/hooks/useAdCampaigns";
import { useDealerAnalytics } from "@/hooks/useDealerAnalytics";
import { useMyListings } from "@/hooks/useMyListings";
import DealerAnalyticsChart from "./DealerAnalyticsChart";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="tfcl-card p-3">
      <div className="text-color-1 mb-1">{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

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

  if (loading) return <p>Loading your ad campaigns...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="mt-4">
      <h4 className="mb-2">Ad campaigns</h4>
      {actionError && <div className="alert alert-danger">{actionError}</div>}

      <form onSubmit={handleSubmit} className="tfcl-card p-3 mb-3">
        <div className="row">
          <div className="col-md-3 form-group">
            <label>Ad product</label>
            <select className="form-control" value={productId} onChange={(e) => setProductId(e.target.value)} required>
              <option value="">Choose...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (£{product.price.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
          {isModelPage ? (
            <div className="col-md-3 form-group">
              <label>Target make</label>
              <input type="text" className="form-control" value={targetMake} onChange={(e) => setTargetMake(e.target.value)} placeholder="e.g. Volvo" />
            </div>
          ) : (
            <div className="col-md-3 form-group">
              <label>Listing to promote</label>
              <select className="form-control" value={listingId} onChange={(e) => setListingId(e.target.value)}>
                <option value="">Choose a live listing...</option>
                {liveListings.map((listing) => (
                  <option key={listing.publicId} value={listing.publicId}>
                    {listing.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="col-md-3 form-group">
            <label>Starts</label>
            <input type="datetime-local" className="form-control" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
          </div>
          <div className="col-md-3 form-group">
            <label>Ends</label>
            <input type="datetime-local" className="form-control" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
          </div>
        </div>
        <button type="submit" className="sc-button" disabled={submitting || !productId}>
          <span>{submitting ? "Launching..." : "Launch campaign"}</span>
        </button>
      </form>

      {campaigns.length === 0 && <p className="tfcl-empty-data">No campaigns yet.</p>}

      {campaigns.length > 0 && (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Status</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>Leads</th>
                <th>CTR</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td>{campaign.product.name}</td>
                  <td className="text-capitalize">{campaign.status}{campaign.running ? " · live" : ""}</td>
                  <td>{campaign.impressions.toLocaleString()}</td>
                  <td>{campaign.clicks.toLocaleString()}</td>
                  <td>{campaign.leads.toLocaleString()}</td>
                  <td>{campaign.clickThroughRate !== null ? `${(campaign.clickThroughRate * 100).toFixed(1)}%` : "-"}</td>
                  <td className="flex gap-10">
                    {campaign.status === "active" && (
                      <button type="button" className="sc-button" onClick={() => setStatus(campaign.id, "paused")}>
                        <span>Pause</span>
                      </button>
                    )}
                    {campaign.status === "paused" && (
                      <button type="button" className="sc-button" onClick={() => setStatus(campaign.id, "active")}>
                        <span>Resume</span>
                      </button>
                    )}
                    {campaign.status !== "ended" && (
                      <button type="button" className="sc-button" onClick={() => setStatus(campaign.id, "ended")}>
                        <span>End</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { analytics, loading, error, isDealer } = useDealerAnalytics(30);

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">Dealer analytics</h1>

                  {!isDealer && <p className="tfcl-empty-data">This page is for dealer accounts only.</p>}
                  {isDealer && loading && <p>Loading your analytics...</p>}
                  {isDealer && error && <div className="alert alert-danger">{error}</div>}

                  {analytics && (
                    <>
                      <div className="row mb-4">
                        <div className="col-md-3 mb-3">
                          <StatTile label="Active listings" value={analytics.activeListingsCount.toLocaleString()} />
                        </div>
                        <div className="col-md-3 mb-3">
                          <StatTile label={`Search impressions (${analytics.periodDays}d)`} value={analytics.searchImpressions.toLocaleString()} />
                        </div>
                        <div className="col-md-3 mb-3">
                          <StatTile label={`Detail views (${analytics.periodDays}d)`} value={analytics.periodDetailViews.toLocaleString()} />
                        </div>
                        <div className="col-md-3 mb-3">
                          <StatTile label="Avg days to sell" value={analytics.averageDaysToSell !== null ? String(analytics.averageDaysToSell) : "-"} />
                        </div>
                      </div>

                      <div className="tfcl-card p-3 mb-4">
                        <h4 className="mb-2">Activity, last {analytics.periodDays} days</h4>
                        <DealerAnalyticsChart series={analytics.series} />
                      </div>

                      <div className="tfcl-card p-3 mb-4">
                        <h4 className="mb-2">Leads</h4>
                        <p className="mb-1">
                          {analytics.leads.total} total ·{" "}
                          {analytics.leads.conversionRate !== null ? `${(analytics.leads.conversionRate * 100).toFixed(1)}% converted` : "no conversions yet"}
                        </p>
                        <p className="text-color-1 mb-0">
                          New {analytics.leads.byStatus.new} · Contacted {analytics.leads.byStatus.contacted} · Converted{" "}
                          {analytics.leads.byStatus.converted} · Lost {analytics.leads.byStatus.lost}
                        </p>
                      </div>

                      {/* FR-C-033 no-show tracking. */}
                      <div className="tfcl-card p-3 mb-4">
                        <h4 className="mb-2">Test drives, last {analytics.periodDays} days</h4>
                        <p className="mb-1">
                          {analytics.appointments.noShowRate !== null
                            ? `${(analytics.appointments.noShowRate * 100).toFixed(1)}% no-show rate`
                            : "No completed or missed test drives yet"}
                        </p>
                        <p className="text-color-1 mb-0">
                          Booked {analytics.appointments.booked} · Completed {analytics.appointments.completed} · No-show{" "}
                          {analytics.appointments.noShow} · Cancelled {analytics.appointments.cancelled}
                        </p>
                      </div>

                      <AdCampaignsPanel />
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
