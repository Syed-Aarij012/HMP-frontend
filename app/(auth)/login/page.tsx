"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, completeTwoFactorChallenge } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.status === "two_factor_required") {
        setChallengeToken(result.challengeToken);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("The provided credentials are incorrect.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTwoFactorSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await completeTwoFactorChallenge(challengeToken!, code);
      router.push("/dashboard");
    } catch {
      setError("Invalid or expired code.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 80, paddingBottom: 80 }}>
      <h1 className="admin-title mb-3">Sign in</h1>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {!challengeToken ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="group-button-submit left">
            <button type="submit" className="pre-btn" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleTwoFactorSubmit}>
          <p>Enter your two-factor code to finish signing in.</p>
          <div className="mb-3">
            <label className="form-label" htmlFor="code">Authentication code</label>
            <input
              id="code"
              type="text"
              className="form-control"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <div className="group-button-submit left">
            <button type="submit" className="pre-btn" disabled={submitting}>
              {submitting ? "Verifying..." : "Verify"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
