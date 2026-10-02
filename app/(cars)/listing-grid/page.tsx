import { Metadata } from "next";
import Hero from "@/components/sections/listing-grid/Hero";
import ListingGridContent from "@/components/sections/listing-grid/ListingGridContent";
import OurPartners from "@/components/sections/listing-grid/OurPartners";
import { getSiteUrl } from "@/lib/site-url";

type ListingGridPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// FR-C-004: "canonicalization rules for faceted URLs (index whitelisted facet combinations
// only)" — make/model/body_type are the only facets reflected in this page's own URL at all
// (see ListingGridContent's router.replace); every other filter (price, year, mileage,
// doors...) stays client-state-only precisely so it can never produce an indexable URL
// combination here. A single whitelisted facet gets its own canonical URL; combining two or
// more collapses the canonical back to just the first one, so Google is never offered a
// combinatorial explosion of near-duplicate faceted pages to index.
function canonicalListingGridUrl(searchParams: Record<string, string | string[] | undefined>): string {
  const siteUrl = getSiteUrl();
  const whitelisted = ["make", "model", "body_type"] as const;

  for (const key of whitelisted) {
    const value = searchParams[key];
    if (typeof value === "string" && value) {
      return `${siteUrl}/listing-grid?${key}=${encodeURIComponent(value)}`;
    }
  }

  return `${siteUrl}/listing-grid`;
}

export async function generateMetadata({ searchParams }: ListingGridPageProps): Promise<Metadata> {
  const resolved = await searchParams;
  const make = typeof resolved.make === "string" ? resolved.make : null;

  return {
    title: make
      ? `${make} cars for sale | HMP - Car Dealer, Rental & Listing`
      : "Listing Grid | HMP - Car Dealer, Rental & Listing",
    description: "HMP - Car Dealer, Rental & Listing",
    alternates: { canonical: canonicalListingGridUrl(resolved) },
  };
}

export default function ListingGridPage() {
  return (
    <>
      <Hero />
      <ListingGridContent />
      <OurPartners />
    </>
  );
}
