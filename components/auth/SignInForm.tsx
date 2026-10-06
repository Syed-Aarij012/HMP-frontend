"use client";

import { useState, type FormEvent } from "react";
import { useAuth, type AuthUser } from "@/contexts/AuthContext";
import { describeApiError } from "@/lib/api-client";

/**
 * Sign in for every kind of account. `onSignedIn` receives the signed-in user so the caller can
 * send them to their own home (lib/roleHome.ts). Accounts that have set up two-factor
 * authentication themselves still get the code step.
 */
export default function SignInForm({
  onSignedIn,
  initialEmail = "",
  initialPassword = "",
  submitLabel = "Sign in",
}: {
  onSignedIn: (user: AuthUser | null) => void;
  initialEmail?: string;
  initialPassword?: string;
  submitLabel?: string;
}) {
  const { login, completeTwoFactorChallenge } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [show, setShow] = useState(false);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (challenge) {
        onSignedIn(await completeTwoFactorChallenge(challenge, code.trim()));
        return;
      }
      const result = await login(email.trim(), password);
      if (result.status === "two_factor_required") {
        setChallenge(result.challengeToken);
      } else {
        onSignedIn(result.user);
      }
    } catch (err) {
      setError(describeApiError(err, challenge ? "That code didn't work." : "That email and password don't match."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="hmp-auth-form" noValidate>
      {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}

      {!challenge ? (
        <>
          <label className="hmp-auth-label" htmlFor="signin-email">Email address</label>
          <input
            id="signin-email"
            type="email"
            className="form-control mb-3"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            suppressHydrationWarning
            required
          />
          <label className="hmp-auth-label" htmlFor="signin-password">Password</label>
          <div className="hmp-auth-password mb-2">
            <input
              id="signin-password"
              type={show ? "text" : "password"}
              className="form-control"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
          <div className="text-end mb-3">
            <a className="fs-13" href="#" data-bs-toggle="modal" data-bs-target="#popup_bid3">
              Forgot password?
            </a>
          </div>
        </>
      ) : (
        <>
          <p className="text-color-1 mb-2">Enter the 6-digit code from your authenticator app.</p>
          <input
            className="form-control mb-3"
            inputMode="numeric"
            aria-label="Authentication code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="one-time-code"
            autoFocus
            required
          />
        </>
      )}

      <button type="submit" className="sc-button w-100" disabled={busy || (!challenge && (!email || !password)) || (challenge !== null && !code)}>
        <span>{busy ? "Signing in..." : challenge ? "Verify" : submitLabel}</span>
      </button>
    </form>
  );
}
