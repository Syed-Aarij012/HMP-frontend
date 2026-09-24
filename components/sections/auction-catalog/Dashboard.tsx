"use client";

import Link from "next/link";
import { useState } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useAuctionLots } from "@/hooks/useAuctionLots";
import type { AuctionLot } from "@/types/auction";

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Open for bidding", value: "open" },
  { label: "Published (upcoming)", value: "published" },
];

function formatPrice(amount: number | null) {
  if (amount === null) return "No bids yet";
  return `£${amount.toLocaleString()}`;
}

function LotRow({ lot }: { lot: AuctionLot }) {
  const title = lot.vehicle
    ? [lot.vehicle.year, lot.vehicle.make, lot.vehicle.model, lot.vehicle.derivative]
        .filter(Boolean)
        .join(" ")
    : "Vehicle details unavailable";

  return (
    <tr>
      <td>
        <Link href={`/auction/${lot.id}`} className="fw-6">
          {title}
        </Link>
        {lot.isHmpAssured && (
          <span className="ms-2" style={{ color: "#405FF2", fontWeight: 600 }}>
            HMP Assured
          </span>
        )}
      </td>
      <td>{lot.vehicle?.mileage?.toLocaleString() ?? "-"} mi</td>
      <td className="text-capitalize">{lot.status.replace("_", " ")}</td>
      <td>{formatPrice(lot.currentPrice)}</td>
      <td>{lot.saleName ?? "-"}</td>
      <td>
        <Link href={`/auction/${lot.id}`} className="sc-button">
          <span>View lot</span>
        </Link>
      </td>
    </tr>
  );
}

function Dashboard() {
  const [status, setStatus] = useState("");
  const { lots, loading, error } = useAuctionLots(status || undefined);

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">Auction catalog</h1>

                  <div className="mb-3 flex align-center gap-10">
                    {STATUS_FILTERS.map((filter) => (
                      <button
                        key={filter.value}
                        type="button"
                        className="sc-button"
                        style={{
                          opacity: status === filter.value ? 1 : 0.55,
                        }}
                        onClick={() => setStatus(filter.value)}
                      >
                        <span>{filter.label}</span>
                      </button>
                    ))}
                  </div>

                  {loading && <p>Loading the auction catalog...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}

                  {!loading && !error && lots.length === 0 && (
                    <p className="tfcl-empty-data">No lots match this filter right now.</p>
                  )}

                  {!loading && !error && lots.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Vehicle</th>
                            <th>Mileage</th>
                            <th>Status</th>
                            <th>Current price</th>
                            <th>Sale</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {lots.map((lot) => (
                            <LotRow key={lot.id} lot={lot} />
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
