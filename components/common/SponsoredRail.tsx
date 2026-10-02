"use client";

import type { MouseEvent, ReactNode } from "react";
import SaleAgentListingCard from "@/components/sections/sale-agents-detail/SaleAgentListingCard";
import { recordSponsoredClick, type SponsoredCar } from "@/hooks/useSponsoredListings";

type SponsoredRailProps = {
  title: string;
  label: string;
  cars: SponsoredCar[];
  subtitle?: ReactNode;
  sectionClassName?: string;
  gridClassName?: string;
};

/**
 * FR-C-021: a labelled, capped sponsored rail — always its own section, never blended into
 * organic results. A click through to a listing (any link inside the card, not the
 * favourite/compare buttons) is recorded against the campaign for attribution.
 */
export default function SponsoredRail({
  title,
  label,
  cars,
  subtitle,
  sectionClassName = "tf-section3",
  gridClassName = "list-car-grid-4 gap-30",
}: SponsoredRailProps) {
  if (cars.length === 0) return null;

  const trackClick = (campaignId: number) => (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("a")) recordSponsoredClick(campaignId);
  };

  return (
    <section className={sectionClassName} aria-label={`${label}: ${title}`}>
      <div className="container">
        <div className="heading-section">
          <p className="fw-6 text-color-2 mb-10">{label}</p>
          <h2 className="heading-tittle">{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className={gridClassName}>
          {cars.map((car) => (
            <div key={`sponsored-${car.campaignId}-${car.id}`} onClickCapture={trackClick(car.campaignId)}>
              <SaleAgentListingCard car={car} layout="grid" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
