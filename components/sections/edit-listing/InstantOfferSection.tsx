"use client";

import { useState } from "react";
import { can, useAuth } from "@/contexts/AuthContext";
import { apiFetch, describeApiError } from "@/lib/api-client";

type Offer = { valuationId: number; value: string };

/**
 * SRS §2.2 P2 Private Seller — "requesting instant-offer disposal" and "accept instant-offer
 * routing into trade auction (with consent workflow)": get an instant offer for the car, read
 * exactly what accepting means, and agree to it. The car then goes into the next trade auction
 * with the offer as its reserve.
 */
export default function InstantOfferSection({ vehiclePublicId, vrm, mileage, listingStatus }: { vehiclePublicId: string; vrm: string | null; mileage: number | null; listingStatus: string }) {
  const { user } = useAuth();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [terms, setTerms] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!can(user, "accept-instant-offer") || !vrm || mileage === null) return null;

  const listed = ["pending_checks", "live", "under_offer", "reserved"].includes(listingStatus);

  async function getOffer() {
    setBusy(true);
    setError(null);
    try {
      const [valuation, consent] = await Promise.all([
        apiFetch<{ data: { id: number; instant_offer_value: string | null } }>("/valuations", { method: "POST", body: { vrm, mileage } }),
        apiFetch<{ data: { consent_text: string } }>("/instant-offer/terms"),
      ]);
      if (!valuation.data.instant_offer_value) throw new Error("We couldn't make an instant offer for this car.");
      setOffer({ valuationId: valuation.data.id, value: valuation.data.instant_offer_value });
      setTerms(consent.data.consent_text);
    } catch (err) {
      setError(describeApiError(err, err instanceof Error ? err.message : "Could not get an instant offer."));
    } finally {
      setBusy(false);
    }
  }

  async function accept() {
    if (!offer) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/vehicles/${vehiclePublicId}/instant-offer/accept`, {
        method: "POST",
        body: { valuation_id: offer.valuationId, consent: agreed },
      });
      setDone(true);
    } catch (err) {
      setError(describeApiError(err, "Could not accept the instant offer."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tfcl-card p-3 mb-3">
      <h4 className="mb-1">Sell to the trade instead</h4>
      {done ? (
        <div className="alert alert-success mb-0">
          Done — your car is entered into the next trade auction with a reserve of £{Number(offer?.value).toLocaleString("en-GB")}. You can follow it
          under My consigned vehicles once it&apos;s catalogued.
        </div>
      ) : (
        <>
          <p className="text-color-1 fs-13 mb-2">
            Get an instant offer and we&apos;ll sell your car to trade buyers at auction — no viewings or negotiating.
            {listed && " Withdraw your listing first if you choose this."}
          </p>
          {!offer ? (
            <button type="button" className="sc-button" disabled={busy} onClick={getOffer}>
              <span>{busy ? "Working out your offer..." : "Get an instant offer"}</span>
            </button>
          ) : (
            <>
              <div className="mb-2" style={{ fontSize: 22, fontWeight: 700 }}>
                Instant offer: £{Number(offer.value).toLocaleString("en-GB")}
              </div>
              <div className="p-2 mb-2" style={{ background: "#F4F6FB", borderRadius: 8, fontSize: 14 }}>{terms}</div>
              <label className="d-flex gap-2 align-items-start mb-2" style={{ cursor: "pointer" }}>
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 4 }} />
                <span>I agree to these terms and want to sell my car to the trade.</span>
              </label>
              <button type="button" className="sc-button" disabled={busy || !agreed} onClick={accept}>
                <span>{busy ? "Entering your car..." : "Accept instant offer"}</span>
              </button>
            </>
          )}
        </>
      )}
      {error && <div className="alert alert-danger mt-2 mb-0">{error}</div>}
    </div>
  );
}
