"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getStoredToken, setStoredToken } from "@/lib/api-client";

export const SUPPORT_ORIGINAL_TOKEN_KEY = "hmp_support_original_token";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

/**
 * SRS §2.2 Customer Support Agent — the impersonation-view is *watermarked*: while a support
 * agent is looking at a customer's account, every page carries a banner and a tiled watermark,
 * and the agent can end the view (returning to their own session) from here. The API refuses
 * any change made through this session regardless.
 */
export default function SupportViewWatermark() {
  const { user } = useAuth();
  const view = user?.impersonation;
  if (!view) return null;

  async function endView() {
    const original = window.localStorage.getItem(SUPPORT_ORIGINAL_TOKEN_KEY);
    try {
      if (original) {
        await fetch(`${API_URL}/support/impersonations/${view!.session_id}/end`, {
          method: "POST",
          headers: { Authorization: `Bearer ${original}`, Accept: "application/json" },
        });
      }
    } finally {
      window.localStorage.removeItem(SUPPORT_ORIGINAL_TOKEN_KEY);
      setStoredToken(original ?? null);
      window.location.assign(original ? "/admin/support" : "/");
    }
  }

  const label = `SUPPORT VIEW · READ ONLY · ${view.support_agent ?? "HMP Support"}`;
  const tiles = Array.from({ length: 40 }, (_, i) => i);

  return (
    <>
      <div
        role="status"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100000,
          background: "#b91c1c",
          color: "#fff",
          padding: "8px 16px",
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        <span>
          Read-only support view of {user?.name} ({user?.email}) by {view.support_agent ?? "HMP Support"}
          {view.expires_at ? ` · ends ${new Date(view.expires_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""}.
          Nothing can be changed.
        </span>
        {getStoredToken() && (
          <button type="button" onClick={endView} style={{ background: "#fff", color: "#b91c1c", border: 0, borderRadius: 6, padding: "4px 10px", fontWeight: 700 }}>
            End support view
          </button>
        )}
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          pointerEvents: "none",
          overflow: "hidden",
          display: "flex",
          flexWrap: "wrap",
          alignContent: "flex-start",
          opacity: 0.09,
          transform: "rotate(-24deg) scale(1.4)",
        }}
      >
        {tiles.map((i) => (
          <span key={i} style={{ fontSize: 22, fontWeight: 800, color: "#b91c1c", padding: "40px 30px", whiteSpace: "nowrap" }}>
            {label}
          </span>
        ))}
      </div>
    </>
  );
}
