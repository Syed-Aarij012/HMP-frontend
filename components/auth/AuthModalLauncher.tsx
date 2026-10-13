"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { openAuthModal } from "@/lib/authModal";
import { destinationAfterAuth } from "@/lib/roleHome";

/**
 * Opens the sign-in / sign-up pop-up when a URL asks for it (`?auth=login&next=/my-offers`) —
 * which is where the retired /login, /register and /admin/login pages now redirect. Someone
 * already signed in goes straight on to where they were heading.
 */
export default function AuthModalLauncher() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const kind = params.get("auth");
  const next = params.get("next");

  useEffect(() => {
    if (loading || (kind !== "login" && kind !== "register")) return;

    if (user) {
      router.replace(destinationAfterAuth(user, next));
      return;
    }

    openAuthModal(kind, next);

    // Tidy the URL so a refresh doesn't reopen it.
    const rest = new URLSearchParams(params.toString());
    rest.delete("auth");
    rest.delete("next");
    rest.delete("type");
    router.replace(rest.size ? `${pathname}?${rest.toString()}` : pathname, { scroll: false });
  }, [kind, next, loading, user, params, pathname, router]);

  return null;
}
