"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { describeApiError } from "@/lib/api-client";

function closeModal(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  void import("bootstrap/js/dist/modal").then(({ default: Modal }) => {
    Modal.getOrCreateInstance(element).hide();
  });
}

export default function LoginForm() {
  const router = useRouter();
  const { login, completeTwoFactorChallenge } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.status === "two_factor_required") {
        setChallengeToken(result.challengeToken);
      } else {
        closeModal("popup_bid");
        router.push("/dashboard");
      }
    } catch (err) {
      setError(describeApiError(err, "The provided credentials are incorrect."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTwoFactorSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await completeTwoFactorChallenge(challengeToken!, code);
      closeModal("popup_bid");
      router.push("/dashboard");
    } catch (err) {
      setError(describeApiError(err, "Invalid or expired code."));
    } finally {
      setSubmitting(false);
    }
  }

  if (challengeToken) {
    return (
      <form className="comment-form form-submit" onSubmit={handleTwoFactorSubmit}>
        <p>Enter your two-factor code to finish signing in.</p>
        {error && <div className="alert alert-danger mb-3">{error}</div>}
        <fieldset className="">
          <label className="fw-5">Authentication code</label>
          <input
            type="text"
            className="tb-my-input"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
          />
        </fieldset>
        <button className="sc-button" type="submit" disabled={submitting}>
          <span>{submitting ? "Verifying..." : "Verify"}</span>
        </button>
      </form>
    );
  }

  return (
    <form className="comment-form form-submit" onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger mb-3">{error}</div>}
      <fieldset className="">
        <label className="fw-5">Email address</label>
        <input
          type="email"
          className="tb-my-input"
          name="email"
          // See ForgotPassForm.tsx: some browser extensions inject attributes into every
          // email input before hydration — a real, expected, harmless mismatch.
          suppressHydrationWarning
          placeholder="e.g john doe"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </fieldset>
      <fieldset className="style-wrap">
        <label className="fw-5">Password</label>
        <input
          type="password"
          className="input-form password-input"
          placeholder="Your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </fieldset>
      <div className="flex-two flex-wrap gap-30 remember-me">
        <div className="title-forgot">
          <a
            className="text-p"
            data-bs-toggle="modal"
            data-bs-target="#popup_bid3"
            data-bs-dismiss="modal"
          >
            Forgot password?
          </a>
        </div>
      </div>
      <button className="sc-button" type="submit" disabled={submitting}>
        <span>{submitting ? "Signing in..." : "Login"}</span>
      </button>
    </form>
  );
}
