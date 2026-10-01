"use client";

import SaleAgentListingCard from "@/components/sections/sale-agents-detail/SaleAgentListingCard";
import { useRecentlyViewed, useRecommendedListings, usePersonalizationConsent } from "@/hooks/usePersonalization";
import type { Car } from "@/types/cars";

function Rail({ title, cars }: { title: string; cars: Car[] }) {
  if (cars.length === 0) return null;

  return (
    <section className="tf-section3">
      <div className="container">
        <div className="heading-section wow fadeInUp">
          <h2 className="heading-tittle">{title}</h2>
        </div>
        <div className="list-car-grid-4 gap-30">
          {cars.map((car) => (
            <SaleAgentListingCard key={car.id} car={car} layout="grid" />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * FR-B-007(b): "personalized homepage rails from consented behavioral signals" — replaces the
 * old "Recently viewed cars" heading that actually rendered home04/TrendingCars' static
 * hardcoded model list (no API call, no per-user data at all, same class of bug as the old
 * listing-grid Filters.tsx). Signed out or not yet consented: a one-line prompt instead of a
 * fabricated rail.
 */
export default function PersonalizedRails() {
  const { consented, setConsent, saving, signedIn } = usePersonalizationConsent();
  const { cars: recentlyViewed } = useRecentlyViewed();
  const { cars: recommended } = useRecommendedListings();

  if (!signedIn) {
    return null;
  }

  if (!consented) {
    return (
      <section className="tf-section3">
        <div className="container">
          <div className="heading-section flex align-center justify-space flex-wrap gap-20">
            <div>
              <h2 className="heading-tittle">Recently viewed &amp; recommended</h2>
              <p>Turn on personalization to see your recently viewed cars and picks based on them.</p>
            </div>
            <button type="button" className="sc-button" disabled={saving} onClick={() => setConsent(true)}>
              <span>{saving ? "Saving..." : "Turn on"}</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <Rail title="Recently viewed" cars={recentlyViewed} />
      <Rail title="Recommended for you" cars={recommended} />
    </>
  );
}
