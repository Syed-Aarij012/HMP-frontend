"use client";

import { useState, type FormEvent } from "react";
import { useTwoFactor } from "@/hooks/useTwoFactor";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Badge, Notice } from "@/components/ui/kit";

function Security() {
  const { isEnabled, qrSvg, recoveryCodes, submitting, error, start, confirm, disable } = useTwoFactor();
  const [currentPassword, setCurrentPassword] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  async function handleStart(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    try {
      await start(currentPassword);
    } catch {
      // error already surfaced by the hook
    }
  }

  async function handleConfirm(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    try {
      await confirm(code);
      setCode("");
      setNotice("Two-factor authentication is now enabled. Save your recovery codes below.");
    } catch {
      // error already surfaced by the hook
    }
  }

  async function handleDisable(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    try {
      await disable(currentPassword);
      setCurrentPassword("");
      setNotice("Two-factor authentication has been disabled.");
    } catch {
      // error already surfaced by the hook
    }
  }

  return (
    <DashboardPage title="Security" description={<>Two-factor authentication is required before placing a bid of £10,000 or more, and to enroll in it you&apos;ll need an authenticator app (Google Authenticator, Authy, etc.).</>}>
      {notice && <Notice tone="success">{notice}</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}

      {isEnabled && !recoveryCodes && (
        <div className="ha-card ha-card-body ha-form-card mb-4">
          <h2 className="hd-card-title">
            Two-factor authentication <Badge tone="success">On</Badge>
          </h2>
          <form onSubmit={handleDisable}>
            <div className="ha-field">
              <label htmlFor="disable_password">Current password</label>
              <input
                id="disable_password"
                type="password"
                className="ha-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="ha-btn is-danger" disabled={submitting} aria-busy={submitting}>{submitting ? "Disabling…" : "Disable two-factor authentication"}</button>
          </form>
        </div>
      )}

      {!isEnabled && !qrSvg && (
        <form onSubmit={handleStart} className="ha-card ha-card-body ha-form-card mb-4">
          <h2 className="hd-card-title">
            Two-factor authentication <Badge>Off</Badge>
          </h2>
          <p className="ha-muted">Confirm your password to start setting it up.</p>
          <div className="ha-field">
            <label htmlFor="start_password">Current password</label>
            <input
              id="start_password"
              type="password"
              className="ha-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="ha-btn is-primary" disabled={submitting}>{submitting ? "Starting…" : "Start enrollment"}</button>
        </form>
      )}

      {!isEnabled && qrSvg && (
        <form onSubmit={handleConfirm} className="ha-card ha-card-body ha-form-card mb-4">
          <h2 className="hd-card-title">Scan this code in your authenticator app</h2>
          <div
            className="mb-3"
            style={{ background: "#fff", padding: 16, display: "inline-block", border: "1px solid var(--hmp-border)", borderRadius: 12 }}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <div className="ha-field">
            <label htmlFor="confirm_code">6-digit code</label>
            <input
              id="confirm_code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="ha-input"
              style={{ maxWidth: 200, letterSpacing: 4, fontSize: 18 }}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="ha-btn is-primary" disabled={submitting}>{submitting ? "Confirming…" : "Confirm and enable"}</button>
        </form>
      )}

      {recoveryCodes && (
        <div className="ha-card ha-card-body ha-form-card mb-4">
          <h2 className="hd-card-title">Save your recovery codes</h2>
          <p className="ha-muted mb-2">
            Each code can be used once if you lose access to your authenticator
            app. This is the only time they&apos;ll be shown.
          </p>
          <ul className="ha-codes">
            {recoveryCodes.map((rc) => (
              <li key={rc}>
                <code>{rc}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardPage>
  );
}

export default Security;
