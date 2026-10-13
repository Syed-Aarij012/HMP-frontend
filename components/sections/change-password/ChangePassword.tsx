"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api-client";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Card, Notice } from "@/components/ui/kit";

function ChangePassword() {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== passwordConfirmation) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, password, passwordConfirmation);
      setSuccess(true);
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirmation("");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not change your password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Live feedback on the password rules (the server still validates on submit).
  const rules = [
    { label: "One number", met: /\d/.test(password) },
    { label: "One lowercase character", met: /[a-z]/.test(password) },
    { label: "One uppercase character", met: /[A-Z]/.test(password) },
    { label: "8 characters minimum", met: password.length >= 8 },
  ];

  return (
    <DashboardPage title="Change password" description="Use a password you don't use anywhere else.">
      <Card className="ha-form-card">
        <form className="ha-card-body" onSubmit={handleSubmit}>
          {error && <Notice tone="danger">{error}</Notice>}
          {success && <Notice tone="success">Password updated.</Notice>}
          <div className="ha-field">
            <label htmlFor="current_password">Current password</label>
            <input
              type="password"
              className="ha-input"
              id="current_password"
              name="current_password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </div>
          <div className="ha-field">
            <label htmlFor="new_password">New password</label>
            <input
              type="password"
              className="ha-input"
              id="new_password"
              name="new_password"
              autoComplete="new-password"
              aria-describedby="password-rules"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
            <ul id="password-rules" className="ha-rules">
              {rules.map((rule) => (
                <li key={rule.label} className={rule.met ? "is-met" : undefined}>
                  <span aria-hidden="true">{rule.met ? "✓" : "•"}</span>
                  {rule.label}
                  <span className="ha-visually-hidden">{rule.met ? " (met)" : " (not met yet)"}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="ha-field">
            <label htmlFor="confirm_password">Confirm new password</label>
            <input
              type="password"
              className="ha-input"
              id="confirm_password"
              name="confirm_password"
              autoComplete="new-password"
              aria-invalid={passwordConfirmation !== "" && passwordConfirmation !== password}
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              required
            />
            {passwordConfirmation !== "" && passwordConfirmation !== password && <div className="ha-error-text">Passwords don&apos;t match yet.</div>}
          </div>
          <button className="ha-btn is-primary" type="submit" disabled={submitting} aria-busy={submitting}>
            {submitting ? "Changing…" : "Change password"}
          </button>
        </form>
      </Card>
    </DashboardPage>
  );
}

export default ChangePassword;
