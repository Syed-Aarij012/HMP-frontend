"use client";

import { useRouter } from "next/navigation";
import SignInForm from "@/components/auth/SignInForm";
import { homeFor } from "@/lib/roleHome";

function closeModal(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  void import("bootstrap/js/dist/modal").then(({ default: Modal }) => {
    Modal.getOrCreateInstance(element).hide();
  });
}

/** The header's sign-in pop-up — the same form as /login, sending each role to its own home. */
export default function LoginForm() {
  const router = useRouter();

  return (
    <div className="hmp-auth-modal">
      <SignInForm
        submitLabel="Login"
        onSignedIn={(user) => {
          closeModal("popup_bid");
          router.push(homeFor(user));
        }}
      />
    </div>
  );
}
