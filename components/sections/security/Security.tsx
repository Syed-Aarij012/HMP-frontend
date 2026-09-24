"use client";

import { useState, type FormEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useTwoFactor } from "@/hooks/useTwoFactor";

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
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">Security</h1>
                  <p className="text-color-1 mb-3">
                    Two-factor authentication is required before placing a bid of £10,000 or
                    more, and to enroll in it you&apos;ll need an authenticator app (Google
                    Authenticator, Authy, etc.).
                  </p>

                  {notice && <div className="alert alert-success mb-3">{notice}</div>}
                  {error && <div className="alert alert-danger mb-3">{error}</div>}

                  {isEnabled && !recoveryCodes && (
                    <div className="tfcl-card mb-4">
                      <h4 className="mb-2">Two-factor authentication is enabled</h4>
                      <form onSubmit={handleDisable}>
                        <div className="form-group">
                          <label htmlFor="disable_password">Current password</label>
                          <input
                            id="disable_password"
                            type="password"
                            className="form-control"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                          />
                        </div>
                        <button type="submit" className="sc-button" disabled={submitting}>
                          <span>{submitting ? "Disabling..." : "Disable two-factor authentication"}</span>
                        </button>
                      </form>
                    </div>
                  )}

                  {!isEnabled && !qrSvg && (
                    <form onSubmit={handleStart} className="tfcl-card mb-4">
                      <h4 className="mb-2">Enable two-factor authentication</h4>
                      <div className="form-group">
                        <label htmlFor="start_password">Current password</label>
                        <input
                          id="start_password"
                          type="password"
                          className="form-control"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                      </div>
                      <button type="submit" className="sc-button" disabled={submitting}>
                        <span>{submitting ? "Starting..." : "Start enrollment"}</span>
                      </button>
                    </form>
                  )}

                  {!isEnabled && qrSvg && (
                    <form onSubmit={handleConfirm} className="tfcl-card mb-4">
                      <h4 className="mb-2">Scan this code in your authenticator app</h4>
                      <div
                        className="mb-3"
                        style={{ background: "#fff", padding: 16, display: "inline-block" }}
                        dangerouslySetInnerHTML={{ __html: qrSvg }}
                      />
                      <div className="form-group">
                        <label htmlFor="confirm_code">6-digit code</label>
                        <input
                          id="confirm_code"
                          type="text"
                          inputMode="numeric"
                          className="form-control"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          required
                        />
                      </div>
                      <button type="submit" className="sc-button" disabled={submitting}>
                        <span>{submitting ? "Confirming..." : "Confirm and enable"}</span>
                      </button>
                    </form>
                  )}

                  {recoveryCodes && (
                    <div className="tfcl-card mb-4">
                      <h4 className="mb-2">Save your recovery codes</h4>
                      <p className="text-color-1 mb-2">
                        Each code can be used once if you lose access to your authenticator
                        app. This is the only time they&apos;ll be shown.
                      </p>
                      <ul>
                        {recoveryCodes.map((rc) => (
                          <li key={rc}><code>{rc}</code></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Security;
