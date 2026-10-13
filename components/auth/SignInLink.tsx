"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { openAuthModal } from "@/lib/authModal";

/** "Sign in" anywhere on the site: opens the sign-in pop-up, then brings the visitor back here. */
export default function SignInLink({ children, className }: { children: ReactNode; className?: string }) {
  const pathname = usePathname();
  return (
    <a
      href={`/?auth=login&next=${encodeURIComponent(pathname)}`}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        openAuthModal("login", pathname);
      }}
    >
      {children}
    </a>
  );
}
