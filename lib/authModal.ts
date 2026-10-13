"use client";

/**
 * Sign-in and sign-up happen in one place: the header's pop-ups (#popup_bid / #popup_bid2).
 * Anything that needs the visitor signed in opens them from here; old /login, /register and
 * /admin/login URLs redirect to `/?auth=…` and the launcher opens them (AuthModalLauncher).
 */
const NEXT_KEY = "hmp_auth_next";
const IDS = { login: "popup_bid", register: "popup_bid2" } as const;

export type AuthModalKind = keyof typeof IDS;

export function openAuthModal(kind: AuthModalKind, next?: string | null): void {
  try {
    if (next) window.sessionStorage.setItem(NEXT_KEY, next);
    else window.sessionStorage.removeItem(NEXT_KEY);
  } catch {
    // Storage unavailable — the person just lands on their home after signing in.
  }

  void import("bootstrap/js/dist/modal").then(({ default: Modal }) => {
    for (const [other, id] of Object.entries(IDS)) {
      const element = document.getElementById(id);
      if (!element) continue;
      if (other === kind) Modal.getOrCreateInstance(element).show();
      else Modal.getInstance(element)?.hide();
    }
  });
}

export function closeAuthModal(kind: AuthModalKind): void {
  const element = document.getElementById(IDS[kind]);
  if (!element) return;
  void import("bootstrap/js/dist/modal").then(({ default: Modal }) => {
    Modal.getOrCreateInstance(element).hide();
  });
}

/** The page the visitor was trying to reach before signing in (read once). */
export function takeAuthNext(): string | null {
  try {
    const next = window.sessionStorage.getItem(NEXT_KEY);
    window.sessionStorage.removeItem(NEXT_KEY);
    return next;
  } catch {
    return null;
  }
}
