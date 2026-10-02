import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { dealers, getDealerById, getDealerDetailTitle } from "@/data/dealers";
import { parseNumericRouteId } from "@/lib/routes";
import { apiFetch } from "@/lib/api-client";
import { mapApiDealerToDealer, getDealerHref, type ApiDealer } from "@/lib/mapApiDealer";
import { getSiteUrl } from "@/lib/site-url";
import type { Dealer } from "@/types/dealers";

const OPENING_HOURS_SCHEMA_DAYS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

// FR-C-002: schema.org AutoDealer structured data — only for a real dealer (one with a slug
// and organizationId; the template's mock dealers have neither and would just produce a
// JSON-LD block full of fabricated fields).
function dealerJsonLd(dealer: Dealer): Record<string, unknown> | null {
  if (!dealer.slug || !dealer.organizationId) return null;

  const openingHoursSpecification = Object.entries(dealer.openingHours ?? {})
    .filter((entry): entry is [string, { open: string; close: string }] => entry[1] !== null && entry[1] !== undefined)
    .map(([day, hours]) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${OPENING_HOURS_SCHEMA_DAYS[day] ?? day}`,
      opens: hours.open,
      closes: hours.close,
    }));

  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: dealer.name,
    url: `${getSiteUrl()}${getDealerHref(dealer)}`,
    image: dealer.logo,
    telephone: dealer.phone || undefined,
    address: dealer.address ? { "@type": "PostalAddress", streetAddress: dealer.address } : undefined,
    aggregateRating: dealer.reviewCount > 0
      ? { "@type": "AggregateRating", ratingValue: dealer.rating, reviewCount: dealer.reviewCount }
      : undefined,
    openingHoursSpecification: openingHoursSpecification.length > 0 ? openingHoursSpecification : undefined,
  };
}

type DealerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export type DealerDetailSectionProps = {
  dealer: Dealer;
};

// A mock dealer is keyed by a small numeric id; a real one is keyed by its (never purely
// numeric) slug — the same "numeric mock vs non-numeric real" split lib/listing-detail-page
// uses, just with a slug standing in for a ULID.
async function resolveDealer(id: string): Promise<{ dealer: Dealer; title: string } | null> {
  const dealerId = parseNumericRouteId(id);

  if (dealerId !== null) {
    const dealer = getDealerById(dealerId);
    return dealer ? { dealer, title: getDealerDetailTitle(dealerId) } : null;
  }

  try {
    const response = await apiFetch<{ data: ApiDealer }>(`/dealers/${id}`, { auth: false });
    const dealer = mapApiDealerToDealer(response.data);
    return { dealer, title: dealer.name };
  } catch {
    return null;
  }
}

export function createDealerDetailPageConfig(
  Hero: ComponentType<{ dealer: Dealer }>,
  DealerDetail: ComponentType<DealerDetailSectionProps>,
) {
  function generateStaticParams() {
    return dealers.map((dealer) => ({ id: String(dealer.id) }));
  }

  async function generateMetadata({
    params,
  }: DealerDetailPageProps): Promise<Metadata> {
    const { id } = await params;
    const resolved = await resolveDealer(id);

    if (!resolved) {
      return {
        title: "Dealer Detail | HMP - Car Dealer, Rental & Listing",
      };
    }

    return {
      title: `${resolved.title} | HMP`,
      description: "HMP - Car Dealer, Rental & Listing",
    };
  }

  async function Page({ params }: DealerDetailPageProps) {
    const { id } = await params;
    const resolved = await resolveDealer(id);

    if (!resolved) {
      notFound();
    }

    const { dealer } = resolved;

    return (
      <>
        {/* FR-C-002: AutoDealer structured data — real dealers only (jsonLd is null for the
            template's mock dealers, which have no slug/organizationId to ground it in). */}
        {dealerJsonLd(dealer) && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(dealerJsonLd(dealer)) }}
          />
        )}
        <Hero dealer={dealer} />
        <DealerDetail dealer={dealer} />
      </>
    );
  }

  return { generateStaticParams, generateMetadata, default: Page };
}
