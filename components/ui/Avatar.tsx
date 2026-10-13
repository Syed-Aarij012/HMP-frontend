"use client";

import { useState } from "react";
import { initials } from "@/components/ui/kit";

/**
 * A person's photo, or their initials when there's no photo or it fails to load (a deleted
 * file, an unreachable storage host) — never a broken-image icon.
 */
export default function Avatar({ src, name, size = 34, className = "hd-avatar" }: { src?: string | null; name?: string | null; size?: number; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const showImage = Boolean(src) && failed !== src;

  return (
    <span className={className} style={{ width: size, height: size }} aria-hidden="true">
      {showImage ? (
        // A plain <img>: user uploads come from the API's storage host, and onError must fire
        // for a missing file so the initials can take over.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src as string} alt="" width={size} height={size} onError={() => setFailed(src as string)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}
