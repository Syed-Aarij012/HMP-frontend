"use client";

import { useState, type FormEvent } from "react";
import { useValuation } from "@/hooks/useValuation";

const CONFIDENCE_LABEL: Record<string, string> = {
  insufficient_data: "Not enough data yet",
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence",
};

function money(amount: number | null) {
  return amount !== null ? `£${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—";
}

/**
 * FR-C-034: free VRM(VIN) + mileage valuation — anonymous browsing permitted, same as the
 * retail catalog itself.
 */
export default function ValuationTool() {
  const { valuate, result, submitting, error } = useValuation();
  const [vin, setVin] = useState("");
  const [mileage, setMileage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await valuate(vin.trim(), Number(mileage));
  }

  return (
    <div id="themesflat-content">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="tfcl-dashboard mt-4 mb-5">
              <h1 className="admin-title mb-1">Free car valuation</h1>
              <p className="text-color-1 mb-4">
                Enter your VIN and current mileage for an instant estimate, built from real
                listings and sales on this platform. No sign-in required.
              </p>

              <form onSubmit={handleSubmit} className="tfcl-card p-3 mb-4">
                <div className="row">
                  <div className="col-md-7 form-group">
                    <label>Vehicle Identification Number (VIN)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={vin}
                      onChange={(e) => setVin(e.target.value)}
                      placeholder="e.g. WVWZZZ1JZXW000001"
                      required
                    />
                  </div>
                  <div className="col-md-5 form-group">
                    <label>Current mileage</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value)}
                      placeholder="e.g. 42000"
                      required
                    />
                  </div>
                </div>
                {error && <div className="alert alert-danger mt-2">{error}</div>}
                <button type="submit" className="sc-button mt-2" disabled={submitting || !vin || !mileage}>
                  <span>{submitting ? "Valuing..." : "Get my valuation"}</span>
                </button>
              </form>

              {result && (
                <div className="tfcl-card p-3">
                  <h4 className="mb-2">Estimated value</h4>
                  <p className="text-color-1 mb-3">
                    {CONFIDENCE_LABEL[result.confidenceBand] ?? result.confidenceBand}
                  </p>

                  {result.confidenceBand === "insufficient_data" ? (
                    <p className="tfcl-empty-data">
                      There isn&apos;t enough comparable data on the platform yet for this
                      make and model. Try again once more listings are available.
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table">
                        <tbody>
                          <tr>
                            <td>Private sale value</td>
                            <td>
                              <b>{money(result.privateSaleValue)}</b>
                            </td>
                          </tr>
                          <tr>
                            <td>Part-exchange value</td>
                            <td>{money(result.partExchangeValue)}</td>
                          </tr>
                          <tr>
                            <td>Instant-offer value</td>
                            <td>{money(result.instantOfferValue)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
