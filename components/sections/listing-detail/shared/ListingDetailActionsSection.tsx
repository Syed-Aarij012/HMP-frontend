"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { can, useAuth } from "@/contexts/AuthContext";
import { useMakeOffer } from "@/hooks/useOffers";
import { useBookAppointment } from "@/hooks/useAppointments";
import { useInitiateDirectBuy } from "@/hooks/useDirectBuy";
import type { Car } from "@/types/cars";
import PartExchangeStep from "./PartExchangeStep";

// FR-C-030/FR-E-011: the deposit is a fixed, platform-wide amount (config('direct_buy.deposit_amount')),
// not derived from the listing price — shown here only as a heads-up before the buyer commits; the
// authoritative figure comes back on the created order itself.
const DIRECT_BUY_DEPOSIT_DISPLAY = 199;
const DIRECT_BUY_COOLING_OFF_DAYS = 14;

/**
 * FR-C-032/033/030: making an offer, booking a test drive, or buying outright with a
 * refundable holding deposit — directly on the listing a buyer is already looking at,
 * previously only reachable (buy-now not reachable at all) via the raw API.
 */
export default function ListingDetailActionsSection({ car }: { car: Car }) {
  const { user } = useAuth();
  const router = useRouter();
  const listingId = car.publicId;

  const { submit: submitOffer, submitting: offerSubmitting, error: offerError } = useMakeOffer(listingId ?? "");
  const { submit: submitAppointment, submitting: appointmentSubmitting, error: appointmentError, booked } = useBookAppointment(listingId ?? "");
  const { initiate: initiateDirectBuy, submitting: buySubmitting, error: buyError } = useInitiateDirectBuy(listingId ?? "");

  const [offerAmount, setOfferAmount] = useState("");
  const [offerSent, setOfferSent] = useState(false);
  const [sentAmount, setSentAmount] = useState("");
  const [partExchangeVehicleId, setPartExchangeVehicleId] = useState<number | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [activeForm, setActiveForm] = useState<"offer" | "test-drive" | "buy" | null>(null);

  if (!listingId) return null;

  // SRS §2.2 P1: buying, offers and test drives are buyer capabilities — only offered to an
  // account that holds them (the API refuses everyone else anyway).
  const canBuyNow = car.rawStatus === "live" && can(user, "purchase-vehicles");
  const canOffer = can(user, "make-offers");
  const canBookTestDrive = can(user, "book-test-drives");

  async function handleBuyNowConfirm() {
    const order = await initiateDirectBuy();
    if (order) {
      router.push(`/my-orders/${order.publicId}`);
    }
  }

  async function handleOfferSubmit(event: FormEvent) {
    event.preventDefault();
    const ok = await submitOffer(offerAmount, partExchangeVehicleId !== null ? String(partExchangeVehicleId) : undefined);
    if (ok) {
      setSentAmount(offerAmount);
      setOfferSent(true);
      setOfferAmount("");
    }
  }

  async function handleAppointmentSubmit(event: FormEvent) {
    event.preventDefault();
    if (!scheduledAt) return;
    await submitAppointment(new Date(scheduledAt).toISOString());
  }

  if (!user) {
    return (
      <div className="tfcl-card p-3 mb-4">
        <p className="mb-0">
          <Link href="/login">Sign in</Link> to make an offer, book a test drive, or message the
          seller about this vehicle.
        </p>
      </div>
    );
  }

  if (!canBuyNow && !canOffer && !canBookTestDrive) {
    const isSeller = can(user, "manage-own-listings") || can(user, "manage-org-listings");
    return (
      <div className="tfcl-card p-3 mb-4">
        <p className="mb-0">
          {isSeller ? (
            <>
              You&apos;re signed in with a selling account — buying, offers and test drives are for buyer accounts.
              Manage your own cars from <Link href="/my-listing">My listings</Link>.
            </>
          ) : (
            <>Buying, offers and test drives are available to private buyer accounts.</>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="tfcl-card p-3 mb-4">
      <div className="flex gap-10 mb-2" style={{ flexWrap: "wrap" }}>
        {canBuyNow && (
          <button
            type="button"
            className="sc-button"
            onClick={() => setActiveForm(activeForm === "buy" ? null : "buy")}
          >
            <span>Buy now</span>
          </button>
        )}
        {canOffer && (
          <button
            type="button"
            className="sc-button"
            onClick={() => setActiveForm(activeForm === "offer" ? null : "offer")}
          >
            <span>Make an offer</span>
          </button>
        )}
        {canBookTestDrive && (
          <button
            type="button"
            className="sc-button"
            onClick={() => setActiveForm(activeForm === "test-drive" ? null : "test-drive")}
          >
            <span>Book a test drive</span>
          </button>
        )}
        <Link href="/valuation-tool" className="sc-button">
          <span>Free valuation</span>
        </Link>
      </div>

      {activeForm === "buy" && (
        <div className="mt-2">
          <p className="mb-2">
            Reserve this car at £{car.price.toLocaleString()} with a refundable £{DIRECT_BUY_DEPOSIT_DISPLAY}{" "}
            holding deposit, taken now. You have {DIRECT_BUY_COOLING_OFF_DAYS} days to cancel for a full refund
            — the exact deposit and cancellation deadline will be confirmed on the next screen.
          </p>
          <button type="button" className="sc-button" disabled={buySubmitting} onClick={handleBuyNowConfirm}>
            <span>{buySubmitting ? "Placing deposit..." : "Confirm & pay deposit"}</span>
          </button>
          {buyError && <div className="alert alert-danger mt-2">{buyError}</div>}
        </div>
      )}

      {activeForm === "offer" && (
        <div className="mt-2">
          {offerSent ? (
            <div className="alert alert-success">
              Your offer of £{Number(sentAmount || 0).toLocaleString()}
              {partExchangeVehicleId !== null ? " with your part-exchange" : ""} has been sent to the seller. Track it
              under <Link href="/my-offers">My offers</Link>.
            </div>
          ) : (
            <form onSubmit={handleOfferSubmit}>
              <div className="flex gap-10">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  placeholder={`Your offer (asking price £${car.price.toLocaleString()})`}
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  required
                />
                <button type="submit" className="sc-button" disabled={offerSubmitting}>
                  <span>{offerSubmitting ? "Sending..." : "Send offer"}</span>
                </button>
              </div>
              {/* FR-C-032: optional part-exchange declaration with VRM lookup + instant range. */}
              <PartExchangeStep onChange={setPartExchangeVehicleId} />
            </form>
          )}
          {offerError && <div className="alert alert-danger mt-2">{offerError}</div>}
        </div>
      )}

      {activeForm === "test-drive" && (
        <div className="mt-2">
          {booked ? (
            <div className="alert alert-success">
              Your test drive is booked. See <Link href="/my-appointments">My appointments</Link>.
            </div>
          ) : (
            <form onSubmit={handleAppointmentSubmit} className="flex gap-10">
              <input
                type="datetime-local"
                className="form-control"
                value={scheduledAt}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
              <button type="submit" className="sc-button" disabled={appointmentSubmitting}>
                <span>{appointmentSubmitting ? "Booking..." : "Book"}</span>
              </button>
            </form>
          )}
          {appointmentError && <div className="alert alert-danger mt-2">{appointmentError}</div>}
        </div>
      )}
    </div>
  );
}
