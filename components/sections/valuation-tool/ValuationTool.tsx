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

// FR-C-034's licensed half is a stand-in until a CAP/Glass's-class licence is connected —
// say so wherever its figure is shown.
const SOURCE_LABEL: Record<string, string> = {
  "simulated-trade-guide": "Trade guide (simulated — no licensed data provider connected)",
};

/**
 * FR-C-034: free VRM + mileage valuation — anonymous browsing permitted, same as the retail
 * catalog itself. The figure blends the platform's own comparable sales with licensed trade
 * guide data, and the result shows both inputs.
 */
export default function ValuationTool() {
  const { valuate, result, submitting, error } = useValuation();
  const [vrm, setVrm] = useState("");
  const [mileage, setMileage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await valuate(vrm.trim(), Number(mileage));
  }

  return (
    <div id="themesflat-content">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="tfcl-dashboard mt-4 mb-5">
              <h1 className="admin-title mb-1">Free car valuation</h1>
              <p className="text-color-2 mb-4">
                Enter your registration and current mileage for an instant estimate, built from
                real listings and sales on this platform blended with trade guide data. No sign-in
                required.
              </p>

              <form onSubmit={handleSubmit} className="tfcl-card p-3 mb-4">
                <div className="row">
                  <div className="col-md-7 form-group">
                    <label htmlFor="valuation-vrm">Registration number</label>
                    <input
                      id="valuation-vrm"
                      type="text"
                      className="form-control"
                      style={{ textTransform: "uppercase" }}
                      value={vrm}
                      onChange={(e) => setVrm(e.target.value)}
                      placeholder="e.g. AB12 CDE"
                      maxLength={10}
                      autoComplete="off"
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
                <button type="submit" className="sc-button mt-2" disabled={submitting || !vrm.trim() || !mileage}>
                  <span>{submitting ? "Valuing..." : "Get my valuation"}</span>
                </button>
              </form>

              {result && (
                <div className="tfcl-card p-3">
                  <h4 className="mb-1">Estimated value</h4>
                  {result.vehicle && (
                    <p className="mb-1">
                      {[result.vehicle.year, result.vehicle.make, result.vehicle.model].filter(Boolean).join(" ") || "Vehicle"}{" "}
                      <span className="text-color-2">
                        ({result.vehicle.vrm}
                        {result.vehicle.colour ? ` · ${result.vehicle.colour}` : ""})
                      </span>
                    </p>
                  )}
                  <p className="text-color-2 mb-3">
                    {CONFIDENCE_LABEL[result.confidenceBand] ?? result.confidenceBand}
                  </p>

                  {result.confidenceBand === "insufficient_data" ? (
                    <p className="tfcl-empty-data">
                      We couldn&apos;t value this car: there aren&apos;t enough comparable sales on the
                      platform yet and the trade guide has no figure for it.
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
                      <h5 className="mt-3 mb-1">How we worked this out</h5>
                      <ul className="text-color-2 mb-0">
                        <li>
                          Platform sales:{" "}
                          {result.internal.value !== null
                            ? `${money(result.internal.value)} from ${result.internal.comparables} comparable listing${result.internal.comparables === 1 ? "" : "s"}`
                            : "no comparable listings yet"}
                        </li>
                        <li>
                          {result.licensed
                            ? `${SOURCE_LABEL[result.licensed.source] ?? result.licensed.source}: ${money(result.licensed.value)}`
                            : "Trade guide: no figure for this vehicle"}
                        </li>
                      </ul>
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
