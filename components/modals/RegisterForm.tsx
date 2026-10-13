"use client";

import { useRouter } from "next/navigation";
import SignUpForm from "@/components/auth/SignUpForm";
import { closeAuthModal, takeAuthNext } from "@/lib/authModal";
import { destinationAfterAuth } from "@/lib/roleHome";

/**
 * The one sign-up on HMP — the header's pop-up: buyer, seller, trade buyer or dealership, then
 * straight to the new account's home (or back to the page that asked them to join).
 */
export default function RegisterForm() {
  const router = useRouter();

  return (
    <div className="hmp-auth-modal">
      <SignUpForm
        onSignedUp={(user) => {
          closeAuthModal("register");
          router.push(destinationAfterAuth(user, takeAuthNext()));
        }}
      />
    </div>
  );
}
