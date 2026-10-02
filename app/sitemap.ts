import type { MetadataRoute } from "next";
import { apiFetch } from "@/lib/api-client";
import { getSiteUrl } from "@/lib/site-url";

type SitemapFeedPage = {
  listings: { id: string; updated_at: string | null }[];
  dealers: { slug: string; updated_at: string | null }[];
  page: number;
  has_more: boolean;
};

// Matches the backend feed's own Cache-Control: max-age=300 (ListingToolsController::sitemap)
// — without this, Next would serve whatever this looked like at build time forever, which is
// the opposite of "regenerated on publication events".
export const revalidate = 300;

/**
 * FR-C-004: "XML sitemaps regenerated on publication events" — the backend's sitemap feed
 * (GET /seo/sitemap, ListingToolsController::sitemap) already existed with no consumer
 * anywhere; this is served live at /sitemap.xml by Next's own file convention, so it's always
 * as fresh as the feed itself rather than a static file that needs rebuilding.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date() },
    { url: `${siteUrl}/listing-grid` },
    { url: `${siteUrl}/dealer-listing` },
  ];

  let page = 1;
  let hasMore = true;

  // Bounded so a feed bug can't loop forever — Next's own single-sitemap cap is 50,000 URLs
  // anyway (see generateSitemaps() if this ever needs to split past that).
  while (hasMore && page <= 50) {
    try {
      const response = await apiFetch<SitemapFeedPage>(`/seo/sitemap?page=${page}`, { auth: false });

      for (const listing of response.listings) {
        entries.push({
          url: `${siteUrl}/listing-detail-v1/${listing.id}`,
          lastModified: listing.updated_at ? new Date(listing.updated_at) : undefined,
        });
      }

      for (const dealer of response.dealers) {
        entries.push({
          url: `${siteUrl}/dealer-detail/${dealer.slug}`,
          lastModified: dealer.updated_at ? new Date(dealer.updated_at) : undefined,
        });
      }

      hasMore = response.has_more;
      page += 1;
    } catch {
      // The sitemap must still return whatever it already has rather than fail outright —
      // a partial sitemap is far better than a 500 on /sitemap.xml.
      break;
    }
  }

  return entries;
}
