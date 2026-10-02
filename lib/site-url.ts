// FR-C-004/C-002: the one place that knows this deployment's public origin, for anything
// that needs an absolute URL — canonical tags, sitemap entries, JSON-LD "url" fields. No env
// var existed anywhere in this app for it before now.
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
