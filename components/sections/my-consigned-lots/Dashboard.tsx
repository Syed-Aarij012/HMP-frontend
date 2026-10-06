"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useMyConsignedLots } from "@/hooks/useMyConsignedLots";
import { CONSIGNOR_FIXABLE, describeBlocker } from "@/lib/auctionPublishBlockers";
import type { AuctionLot } from "@/types/auction";

/**
 * A cataloged lot isn't in the live auction yet: it goes live once its VAT and V5C details are
 * in (the consignor's job) and an inspector has published a condition report and the auction
 * team publishes it. This says which of those is outstanding, and lets the consignor fill in
 * the details that are theirs to provide.
 */
function NextSteps({
  lot,
  onSave,
}: {
  lot: AuctionLot;
  onSave: (lotId: string, details: { vatStatus?: string; v5cStatus?: string; acquisitionCost?: number }) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [vatStatus, setVatStatus] = useState("");
  const [v5cStatus, setV5cStatus] = useState("");
  const [acquisitionCost, setAcquisitionCost] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (lot.status !== "cataloged" || lot.publishBlockers === null) return null;

  const blockers = lot.publishBlockers;

  if (blockers.length === 0) {
    return <span className="text-color-2">Ready — waiting for the auction team to publish it.</span>;
  }

  const yours = blockers.filter((code) => (CONSIGNOR_FIXABLE as string[]).includes(code));
  const needsCost = blockers.includes("acquisition_cost") || vatStatus === "margin_scheme";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const message = await onSave(lot.id, {
      vatStatus: vatStatus || undefined,
      v5cStatus: v5cStatus || undefined,
      acquisitionCost: acquisitionCost === "" ? undefined : Number(acquisitionCost),
    });
    setSaving(false);
    if (message) {
      setError(message);
    } else {
      setOpen(false);
      setVatStatus("");
      setV5cStatus("");
      setAcquisitionCost("");
    }
  }

  return (
    <div>
      <ul className="mb-1" style={{ paddingLeft: 18 }}>
        {blockers.map((code) => (
          <li key={code}>{describeBlocker(code)}</li>
        ))}
      </ul>

      {yours.length > 0 && !open && (
        <button type="button" className="sc-button" onClick={() => setOpen(true)}>
          <span>Complete details</span>
        </button>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="mt-2" style={{ maxWidth: 320 }}>
          {blockers.includes("v5c_status") && (
            <select
              className="form-control mb-2"
              aria-label="V5C status"
              value={v5cStatus}
              onChange={(e) => setV5cStatus(e.target.value)}
            >
              <option value="">V5C (logbook)...</option>
              <option value="present">I have the V5C</option>
              <option value="applied_for">I&apos;ve applied for a V5C</option>
            </select>
          )}
          {blockers.includes("vat_status") && (
            <select
              className="form-control mb-2"
              aria-label="VAT status"
              value={vatStatus}
              onChange={(e) => setVatStatus(e.target.value)}
            >
              <option value="">VAT status...</option>
              <option value="qualifying">VAT qualifying</option>
              <option value="margin_scheme">Margin scheme</option>
            </select>
          )}
          {needsCost && (
            <input
              type="number"
              min="0"
              step="0.01"
              className="form-control mb-2"
              aria-label="Acquisition cost"
              placeholder="Acquisition cost (£)"
              value={acquisitionCost}
              onChange={(e) => setAcquisitionCost(e.target.value)}
              required
            />
          )}
          {error && <div className="alert alert-danger py-1">{error}</div>}
          <div className="flex gap-10">
            <button type="submit" className="sc-button" disabled={saving}>
              <span>{saving ? "Saving..." : "Save"}</span>
            </button>
            <button type="button" className="sc-button" disabled={saving} onClick={() => setOpen(false)}>
              <span>Cancel</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Dashboard() {
  const { lots, loading, error, updateCompliance } = useMyConsignedLots();

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">My consigned vehicles</h1>

                  {loading && <p>Loading your consigned vehicles...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}

                  {!loading && !error && lots.length === 0 && (
                    <p className="tfcl-empty-data">
                      You haven&apos;t consigned any vehicles to auction yet.{" "}
                      <Link href="/consign-vehicle">Consign one now</Link>.
                    </p>
                  )}

                  {!loading && !error && lots.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Vehicle</th>
                            <th>Sale</th>
                            <th>Status</th>
                            <th>What&apos;s needed to go live</th>
                            <th>Current price</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {lots.map((lot) => (
                            <tr key={lot.id}>
                              <td>
                                {lot.vehicle
                                  ? [lot.vehicle.year, lot.vehicle.make, lot.vehicle.model]
                                      .filter(Boolean)
                                      .join(" ")
                                  : "-"}
                              </td>
                              <td>{lot.saleName ?? "-"}</td>
                              <td className="text-capitalize">{lot.status.replace("_", " ")}</td>
                              <td>
                                <NextSteps lot={lot} onSave={updateCompliance} />
                              </td>
                              <td>{lot.currentPrice !== null ? `£${lot.currentPrice.toLocaleString()}` : "-"}</td>
                              <td>
                                <Link href={`/auction/${lot.id}`} className="sc-button">
                                  <span>View lot</span>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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

export default Dashboard;
