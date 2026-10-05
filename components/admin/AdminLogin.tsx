"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canUseAdminPanel } from "@/components/admin/AdminSidebar";
import { describeApiError } from "@/lib/api-client";

/** The Admin Panel's own sign-in. Only Super Admin accounts are let through. */
export default function AdminLogin() {
  const { user, loading, login, completeTwoFactorChallenge, logout } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && canUseAdminPanel(user)) router.replace("/admin");
  }, [loading, user, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (challenge) {
        await completeTwoFactorChallenge(challenge, code.trim());
      } else {
        const result = await login(email.trim(), password);
        if (result.status === "two_factor_required") setChallenge(result.challengeToken);
      }
    } catch (err) {
      setError(describeApiError(err, "Those details didn't work."));
    } finally {
      setBusy(false);
    }
  }

  const signedInAsNonAdmin = !loading && user !== null && !canUseAdminPanel(user);

  return (
    <div className="hmp-admin ha-login">
      <div className="ha-login-card">
        <div className="ha-login-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/WhatsApp_Image_2026-09-14_at_3.32.30_PM-removebg-preview.png" alt="HMP" />
        </div>
        <h1>Admin Panel</h1>
        <p className="ha-login-sub">{challenge ? "Enter the code from your authenticator app." : "Sign in with your admin or moderator account."}</p>

        {signedInAsNonAdmin ? (
          <>
            <div className="ha-alert is-warning">{user?.email} doesn&apos;t have access to the Admin Panel.</div>
            <button type="button" className="ha-btn is-primary is-block" onClick={() => logout()}>
              Sign out and use an admin account
            </button>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            {!challenge ? (
              <>
                <div className="ha-field">
                  <label htmlFor="admin-email">Email</label>
                  <input id="admin-email" type="email" className="ha-input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" autoFocus />
                </div>
                <div className="ha-field">
                  <label htmlFor="admin-password">Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      className="ha-input"
                      style={{ paddingRight: 64 }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="ha-btn is-ghost is-sm"
                      style={{ position: "absolute", right: 4, top: 4 }}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="ha-field">
                <label htmlFor="admin-code">Authentication code</label>
                <input id="admin-code" className="ha-input" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} required autoComplete="one-time-code" autoFocus />
              </div>
            )}
            {error && (
              <div className="ha-alert is-danger" role="alert">
                {error}
              </div>
            )}
            <button type="submit" className="ha-btn is-primary is-block" style={{ height: 42 }} disabled={busy || (!challenge && (!email || !password)) || (challenge !== null && !code)}>
              {busy ? "Signing in..." : challenge ? "Verify" : "Sign in"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 13 }}>
          <Link href="/">← Back to the main site</Link>
        </div>
      </div>
    </div>
  );
}
