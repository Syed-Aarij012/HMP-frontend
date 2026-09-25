"use client";

import { useEffect, useState } from "react";

function format(remainingMs: number) {
  const total = Math.max(0, Math.ceil(remainingMs / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * FR-D-015/032: the closing countdown, rendered from the server clock (offsetMs) so every
 * bidder sees the same time left. Turns urgent inside the final minute — the anti-sniping
 * window, where a bid pushes the deadline out again.
 */
export default function LotCountdown({ closesAt, offsetMs }: { closesAt: string | null; offsetMs: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  if (!closesAt) return null;

  const remaining = new Date(closesAt).getTime() - (now + offsetMs);
  const closed = remaining <= 0;
  const urgent = !closed && remaining <= 60_000;

  return (
    <p style={{ fontSize: 18 }}>
      <b>{closed ? "Closing" : "Time left"}:</b>{" "}
      <span style={{ color: closed ? "#999" : urgent ? "#e74c3c" : "inherit", fontVariantNumeric: "tabular-nums" }}>
        {closed ? "ended - concluding..." : format(remaining)}
      </span>
      {urgent && <span className="text-color-1"> (a bid now extends the timer)</span>}
    </p>
  );
}
