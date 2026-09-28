"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMakeOffer } from "@/hooks/useOffers";
import { useBookAppointment } from "@/hooks/useAppointments";
import type { Car } from "@/types/cars";

/**
 * FR-C-032/033: making an offer and booking a test drive, directly on the listing a buyer
 * is already looking at — previously only reachable via the raw API.
 */
export default function ListingDetailActionsSection({ car }: { car: Car }) {
  const { user } = useAuth();
  const listingId = car.publicId;

  const { submit: submitOffer, submitting: offerSubmitting, error: offerError } = useMakeOffer(listingId ?? "");
  const { submit: submitAppointment, submitting: appointmentSubmitting, error: appointmentError, booked } = useBookAppointment(listingId ?? "");

  const [offerAmount, setOfferAmount] = useState("");
  const [offerSent, setOfferSent] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [activeForm, setActiveForm] = useState<"offer" | "test-drive" | null>(null);

  if (!listingId) return null;

  async function handleOfferSubmit(event: FormEvent) {
    event.preventDefault();
    const ok = await submitOffer(offerAmount);
    if (ok) {
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

  return (
    <div className="tfcl-card p-3 mb-4">
      <div className="flex gap-10 mb-2" style={{ flexWrap: "wrap" }}>
        <button
          type="button"
          className="sc-button"
          onClick={() => setActiveForm(activeForm === "offer" ? null : "offer")}
        >
          <span>Make an offer</span>
        </button>
        <button
          type="button"
          className="sc-button"
          onClick={() => setActiveForm(activeForm === "test-drive" ? null : "test-drive")}
        >
          <span>Book a test drive</span>
        </button>
        <Link href="/valuation-tool" className="sc-button">
          <span>Free valuation</span>
        </Link>
      </div>

      {activeForm === "offer" && (
        <div className="mt-2">
          {offerSent ? (
            <div className="alert alert-success">
              Your offer of £{Number(offerAmount || 0).toLocaleString()} has been sent to the
              seller. Track it under <Link href="/my-offers">My offers</Link>.
            </div>
          ) : (
            <form onSubmit={handleOfferSubmit} className="flex gap-10">
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
