"use client";

import { useRouter } from "next/navigation";
import SignUpForm from "@/components/auth/SignUpForm";
import { homeFor } from "@/lib/roleHome";

function closeModal(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  void import("bootstrap/js/dist/modal").then(({ default: Modal }) => {
    Modal.getOrCreateInstance(element).hide();
  });
}

/**
 * The header's sign-up pop-up — the same flow as /register: buyer, seller, trade buyer or
 * dealership, then straight to the new account's home.
 */
export default function RegisterForm() {
  const router = useRouter();

  return (
    <div className="hmp-auth-modal">
      <SignUpForm
        onSignedUp={(user) => {
          closeModal("popup_bid2");
          router.push(homeFor(user));
        }}
      />
    </div>
  );
}
