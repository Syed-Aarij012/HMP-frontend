"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useContactDealer } from "@/components/common/ContactDealerContext";
import { apiFetch, ApiError } from "@/lib/api-client";

export default function ContactDealerForm() {
  const { user } = useAuth();
  const { target } = useContactDealer();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (!user) {
    return (
      <div className="form-send-mess">
        <p className="fs-14">
          Please <Link href="/login">log in</Link> to send a message to this dealer.
        </p>
      </div>
    );
  }

  if (!target) {
    return (
      <div className="form-send-mess">
        <p className="fs-14">This listing isn&apos;t available for messaging.</p>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="form-send-mess">
        <p className="fs-14">
          Your message about &quot;{target.listingTitle}&quot; has been sent.
        </p>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!target) return;

    setError(null);
    setSending(true);

    try {
      await apiFetch(`/listings/${target.listingId}/conversations`, {
        method: "POST",
        body: { body: message },
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send your message right now.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="form-send-mess" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="contact_dealer_message">
          Your message about &quot;{target.listingTitle}&quot;
        </label>
        <textarea
          id="contact_dealer_message"
          className="form-control"
          rows={5}
          placeholder="Hi, is this vehicle still available?"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          maxLength={5000}
        />
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="form-group">
        <p className="fs-12">
          By proceeding, you agree to HMP&apos;s T&amp;Cs and Privacy Policy.
        </p>
      </div>
      <div className="button-boxs">
        <button className="sc-button" name="submit" type="submit" disabled={sending}>
          <span>{sending ? "Sending..." : "Send message"}</span>
        </button>
      </div>
    </form>
  );
}
