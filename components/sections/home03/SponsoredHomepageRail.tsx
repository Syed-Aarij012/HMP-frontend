"use client";

import SponsoredRail from "@/components/common/SponsoredRail";
import { useSponsoredListings } from "@/hooks/useSponsoredListings";

/** FR-C-021 "homepage rails": dealers' paid homepage-rail campaigns, labelled as sponsored. */
export default function SponsoredHomepageRail() {
  const cars = useSponsoredListings("homepage");

  return <SponsoredRail title="Featured by our dealers" label={cars[0]?.sponsoredLabel ?? "Sponsored"} cars={cars} />;
}
