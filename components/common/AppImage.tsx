"use client";

import NextImage, { type ImageProps } from "next/image";

/**
 * Drop-in replacement for next/image's default export. Next's built-in optimizer refuses to
 * fetch any URL that resolves to a private/loopback IP (SSRF protection) — which is exactly
 * what "localhost" is in local dev, where the backend actually runs. Real listing/dealer/
 * profile photos are served straight from that backend, so they'd otherwise crash with
 * "Invalid src prop... hostname is not configured" or an upstream-private-ip error. Detect a
 * remote (http/https) src and skip the optimizer for it; local /assets/... paths are
 * unaffected and still get fully optimized.
 */
export default function AppImage({ unoptimized, src, ...props }: ImageProps) {
  const isRemote = typeof src === "string" && src.startsWith("http");

  return <NextImage src={src} unoptimized={unoptimized ?? isRemote} {...props} />;
}
