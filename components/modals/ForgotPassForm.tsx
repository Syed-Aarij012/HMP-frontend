"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ForgotPassForm() {
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
    } catch {
      // The backend deliberately avoids leaking whether an email is registered,
      // and this request should never surface as a failure to the user either way.
    } finally {
      setSubmitting(false);
      setMessage("If that email is registered, we've sent a reset link to it.");
    }
  }

  return (
    <form
      method="post"
      className="comment-form form-submit"
      action="#"
      acceptCharset="utf-8"
      noValidate
      onSubmit={handleSubmit}
    >
      {message ? (
        <div className="alert alert-success mb-3">{message}</div>
      ) : (
        <fieldset className="t">
          <label className="fw-6">Email address</label>
          <input
            type="email"
            className="tb-my-input"
            name="email"
            // Some email/temp-mail browser extensions inject a background-image + a
            // data-temp-mail-org attribute into every email input before React hydrates —
            // a real, expected, harmless mismatch (not something in our HTML/data).
            suppressHydrationWarning
            placeholder="e.g john doe"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </fieldset>
      )}
      {!message && (
        <button className="sc-button" name="submit" type="submit" disabled={submitting}>
          <span>{submitting ? "Sending..." : "Reset Password"}</span>
        </button>
      )}
      <a
        className="sc-button back-to"
        data-bs-toggle="modal"
        data-bs-target="#popup_bid"
        data-bs-dismiss="modal"
      >
        <i className="icon-carus-arrowright" />
        <span>Back to Login</span>
      </a>
    </form>
  );
}
