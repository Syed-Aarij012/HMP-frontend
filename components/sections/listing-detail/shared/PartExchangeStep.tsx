"use client";

import { useState, type KeyboardEvent } from "react";
import { usePartExchangeAppraisal, type ApiPartExchangeAppraisal } from "@/hooks/usePartExchangeAppraisal";

const pounds = (value: string | number) => `£${Math.round(Number(value)).toLocaleString("en-GB")}`;

export function PartExchangeSummary({ appraisal }: { appraisal: ApiPartExchangeAppraisal }) {
  if (!appraisal.trade_in_range) {
    return (
      <p className="mb-1">
        We don&apos;t have enough recent sales of this model to value it instantly — the dealer will appraise it with
        your offer.
      </p>
    );
  }

  return (
    <>
      <p className="mb-1">
        Instant part-exchange range: <b>{pounds(appraisal.trade_in_range.low)} – {pounds(appraisal.trade_in_range.high)}</b>{" "}
        <span className="text-color-2">({appraisal.confidence} confidence, at {appraisal.mileage.toLocaleString("en-GB")} miles)</span>
      </p>
      {appraisal.outstanding_settlement_figure && (
        <p className="mb-1">
          Outstanding finance to settle: {pounds(appraisal.outstanding_settlement_figure)}
          {appraisal.equity !== null && (
            <>
              {" "}
              · {appraisal.is_negative_equity ? "negative equity" : "equity"} about {pounds(Math.abs(Number(appraisal.equity)))}
            </>
          )}
        </p>
      )}
    </>
  );
}

/**
 * FR-C-032: the optional "I have a car to part-exchange" step inside Make an offer — look up
 * the car by registration, show the instant range, and hand the declared vehicle's id back
 * to the offer. Uses plain buttons (not a nested form) since it sits inside the offer form.
 */
export default function PartExchangeStep({ onChange }: { onChange: (vehicleId: number | null) => void }) {
  const { result, loading, error, appraise, clear } = usePartExchangeAppraisal();
  const [enabled, setEnabled] = useState(false);
  const [vrm, setVrm] = useState("");
  const [mileage, setMileage] = useState("");

  async function lookUp() {
    if (!vrm.trim() || mileage === "") return;
    const appraised = await appraise(vrm.trim(), Number(mileage));
    onChange(appraised?.vehicle.id ?? null);
  }

  // These inputs sit inside the offer form — Enter here looks the car up rather than
  // submitting the offer before the part-exchange has been valued.
  function lookUpOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      lookUp();
    }
  }

  function toggle(on: boolean) {
    setEnabled(on);
    if (!on) {
      clear();
      onChange(null);
    }
  }

  return (
    <div className="mt-2">
      <label>
        <input type="checkbox" checked={enabled} onChange={(e) => toggle(e.target.checked)} /> I have a car to part-exchange
      </label>

      {enabled && !result && (
        <div className="flex gap-10 mt-2" style={{ flexWrap: "wrap" }}>
          <input
            className="form-control"
            style={{ flex: "0 1 160px", textTransform: "uppercase" }}
            placeholder="Registration"
            aria-label="Part-exchange registration"
            value={vrm}
            onChange={(e) => setVrm(e.target.value)}
            onKeyDown={lookUpOnEnter}
            maxLength={10}
          />
          <input
            type="number"
            min="0"
            className="form-control"
            style={{ flex: "0 1 160px" }}
            placeholder="Mileage"
            aria-label="Part-exchange mileage"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            onKeyDown={lookUpOnEnter}
          />
          <button type="button" className="sc-button" disabled={loading || !vrm.trim() || mileage === ""} onClick={lookUp}>
            <span>{loading ? "Looking up..." : "Get instant valuation"}</span>
          </button>
        </div>
      )}

      {error && <div className="alert alert-danger mt-2">{error}</div>}

      {enabled && result && (
        <div className="mt-2 p-2" style={{ background: "#F4F6FB", borderRadius: 8 }}>
          <p className="mb-1">
            <b>
              {[result.vehicle.year, result.vehicle.make, result.vehicle.model].filter(Boolean).join(" ") || "Your car"}
            </b>{" "}
            {result.vehicle.vrm && <span className="text-color-2">({result.vehicle.vrm})</span>}
            {result.vehicle.colour && <span className="text-color-2"> · {result.vehicle.colour}</span>}
          </p>
          <PartExchangeSummary appraisal={result.appraisal} />
          <p className="text-color-2 fs-13 mb-2">The final figure is confirmed by the dealer when they see the car.</p>
          <button
            type="button"
            className="sc-button"
            onClick={() => {
              clear();
              onChange(null);
            }}
          >
            <span>Use a different car</span>
          </button>
        </div>
      )}
    </div>
  );
}
