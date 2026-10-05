"use client";

import ScrollspySection from "@/components/common/ScrollspySection";
import ListingDetailActionsSection from "./ListingDetailActionsSection";
import ListingDetailDescriptionSection from "./ListingDetailDescriptionSection";
import ListingDetailOverviewSection from "./ListingDetailOverviewSection";
import ListingDetailSpecsSection from "./ListingDetailSpecsSection";
import ListingDetailVideoSection from "./ListingDetailVideoSection";
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
      <ListingDetailActionsSection car={car} />
      <ListingDetailDescriptionSection car={car} />
      <ListingDetailVideoSection car={car} />
      <ListingDetailSpecsSection car={car} />
      {showOverview ? (
        <ScrollspySection id="scrollspyHeading1">
          <ListingDetailOverviewSection car={car} />
        </ScrollspySection>
      ) : null}
      <ScrollspySection id="scrollspyHeading2">
        <ListingDetailFeaturesSection car={car} />
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
