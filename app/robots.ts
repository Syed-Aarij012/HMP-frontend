import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * FR-C-004: every route under app/(dashboard) and app/(auth) sits behind
 * DashboardLayoutClient's auth guard (redirects a signed-out visitor to "/") — crawling them
 * only wastes budget on a page a bot can never actually see, so they're disallowed here
 * rather than left for search engines to discover and bounce off.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/login",
        "/dashboard",
        "/add-listing",
        "/auction",
        "/bidding-deposits",
        "/change-password",
        "/consign-vehicle",
        "/dealer-analytics",
        "/dealer-stock-feed",
        "/grading-matrix",
        "/guided-capture",
        "/inspections",
        "/list-fixed-price",
        "/live-lanes",
        "/message",
        "/my-*",
        "/rostrum",
        "/routing-rules",
        "/saved-searches",
        "/security",
        "/taxonomy",
        "/trade-marketplace",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
