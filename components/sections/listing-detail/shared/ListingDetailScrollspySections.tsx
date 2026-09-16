"use client";

import ScrollspySection from "@/components/common/ScrollspySection";
import ListingDetailDescriptionSection from "./ListingDetailDescriptionSection";
import ListingDetailOverviewSection from "./ListingDetailOverviewSection";
import ListingDetailFeaturesSection from "./ListingDetailFeaturesSection";
import ListingDetailLoanCalculatorSection from "./ListingDetailLoanCalculatorSection";
import ListingDetailLocationSection from "./ListingDetailLocationSection";
import ListingDetailSimilarCarsSection from "./ListingDetailSimilarCarsSection";
import ListingDetailReviewsSection from "./ListingDetailReviewsSection";
import type { Car } from "@/types/cars";

type ListingDetailScrollspySectionsProps = {
  showOverview?: boolean;
  car: Car;
};

export default function ListingDetailScrollspySections({
  showOverview = true,
  car,
}: ListingDetailScrollspySectionsProps) {
  return (
    <>
      <ListingDetailDescriptionSection />
      {showOverview ? (
        <ScrollspySection id="scrollspyHeading1">
          <ListingDetailOverviewSection />
        </ScrollspySection>
      ) : null}
      <ScrollspySection id="scrollspyHeading2">
        <ListingDetailFeaturesSection />
      </ScrollspySection>
      <ScrollspySection id="scrollspyHeading3">
        <ListingDetailSimilarCarsSection car={car} />
      </ScrollspySection>
      <ScrollspySection id="scrollspyHeading4">
        <ListingDetailLoanCalculatorSection />
      </ScrollspySection>
      <ListingDetailLocationSection />
      <ScrollspySection id="scrollspyHeading5">
        <ListingDetailReviewsSection car={car} />
      </ScrollspySection>
    </>
  );
}
