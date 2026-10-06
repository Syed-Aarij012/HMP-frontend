"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import DemoAccounts from "./DemoAccounts";
import SignInForm from "./SignInForm";
import SignUpForm, { type AccountType } from "./SignUpForm";
import { useAuth, type AuthUser } from "@/contexts/AuthContext";
import { describeApiError } from "@/lib/api-client";
import { destinationAfterAuth, homeFor, roleSummary } from "@/lib/roleHome";

const ACCOUNT_TYPE_VALUES: AccountType[] = ["private_buyer", "private_seller", "trade_buyer", "dealer"];

/**
 * One place to sign in or sign up, for every kind of account. After either, each role is sent to
 * its own home — Admin Panel, rostrum, inspections, dealer group or dashboard (lib/roleHome.ts) —
 * or back to the page they came from (`?next=`) when their role can open it.
 */
export default function AuthPage({ initialMode }: { initialMode: "signin" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading, login, logout } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [demoError, setDemoError] = useState<string | null>(null);
  const next = params.get("next");
  const typeParam = params.get("type");
  const initialType = ACCOUNT_TYPE_VALUES.includes(typeParam as AccountType) ? (typeParam as AccountType) : undefined;

  const go = (signedIn: AuthUser | null) => router.push(destinationAfterAuth(signedIn, next));

  async function demoSignIn(email: string, password: string) {
    setDemoError(null);
    try {
      const result = await login(email, password);
      if (result.status === "ok") go(result.user);
      else setDemoError("That demo account has two-factor authentication set up — sign in with the form instead.");
    } catch (err) {
      setDemoError(describeApiError(err, "Couldn't sign in with that demo account."));
    }
  }

  return (
    <div className="hmp-auth">
      <div className="hmp-auth-shell">
        <aside className="hmp-auth-aside">
          <Link href="/" className="hmp-auth-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/WhatsApp_Image_2026-09-14_at_3.32.30_PM-removebg-preview.png" alt="HMP" />
          </Link>
          <h2>Buy, sell and trade cars — all in one place.</h2>
          <ul>
            <li><b>Buyers</b> save cars, make offers and buy online.</li>
            <li><b>Sellers</b> list in minutes or take an instant trade offer.</li>
            <li><b>Dealers</b> run their stock, team and dealer page.</li>
            <li><b>Trade buyers</b> bid live at our trade auctions.</li>
          </ul>
          <p className="hmp-auth-aside-foot">HMP staff sign in here too — you&apos;ll go straight to your own tools.</p>
        </aside>

        <main className="hmp-auth-main">
          {!loading && user ? (
            <div className="text-center">
              <h1>You&apos;re signed in</h1>
              <p className="text-color-1">
                {user.name} · <span style={{ textTransform: "capitalize" }}>{roleSummary(user)}</span>
              </p>
              <div className="d-flex gap-2 justify-content-center flex-wrap">
                <Link href={destinationAfterAuth(user, next)} className="sc-button"><span>Go to {homeFor(user) === "/dashboard" ? "my dashboard" : "my workspace"}</span></Link>
                <button type="button" className="sc-button" onClick={() => logout()}><span>Sign out</span></button>
              </div>
            </div>
          ) : (
            <>
              <div className="hmp-auth-tabs" role="tablist">
                <button type="button" role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "is-active" : undefined} onClick={() => setMode("signin")}>
                  Sign in
                </button>
                <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "is-active" : undefined} onClick={() => setMode("signup")}>
                  Create account
                </button>
              </div>

              {mode === "signin" ? (
                <>
                  <h1>Welcome back</h1>
                  <p className="text-color-1 mb-3">Sign in to your HMP account.</p>
                  <SignInForm onSignedIn={go} />
                  <p className="fs-14 mt-3 mb-0 text-center">
                    New to HMP? <button type="button" className="hmp-auth-link" onClick={() => setMode("signup")}>Create an account</button>
                  </p>
                  {demoError && <div className="alert alert-danger py-2 mt-3">{demoError}</div>}
                  <DemoAccounts onPick={demoSignIn} />
                </>
              ) : (
                <>
                  <h1>Create your account</h1>
                  <SignUpForm onSignedUp={go} initialType={initialType} />
                  <p className="fs-14 mt-3 mb-0 text-center">
                    Already have an account? <button type="button" className="hmp-auth-link" onClick={() => setMode("signin")}>Sign in</button>
                  </p>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
