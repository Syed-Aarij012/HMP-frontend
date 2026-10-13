"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SignInForm from "@/components/auth/SignInForm";
import DemoAccounts from "@/components/auth/DemoAccounts";
import { useAuth, type AuthUser } from "@/contexts/AuthContext";
import { describeApiError } from "@/lib/api-client";
import { closeAuthModal, takeAuthNext } from "@/lib/authModal";
import { destinationAfterAuth } from "@/lib/roleHome";

/**
 * The one sign-in on HMP — the header's pop-up — for every account: buyers, sellers, dealers,
 * trade buyers and HMP staff (Super Admins land in the Admin Panel). Each role goes to its own
 * home, or back to the page that asked them to sign in.
 */
export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [demoError, setDemoError] = useState<string | null>(null);

  function go(user: AuthUser | null) {
    closeAuthModal("login");
    router.push(destinationAfterAuth(user, takeAuthNext()));
  }

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
    <div className="hmp-auth-modal">
      <SignInForm submitLabel="Login" onSignedIn={go} />
      {demoError && <div className="alert alert-danger py-2 mt-3">{demoError}</div>}
      <DemoAccounts onPick={demoSignIn} />
    </div>
  );
}
