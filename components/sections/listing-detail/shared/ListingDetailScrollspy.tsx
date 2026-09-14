"use client";

import { useRef } from "react";
import { ScrollspyProvider } from "@/components/common/ScrollspyProvider";
import { useScrollspy } from "@/hooks/useScrollspy";
import { LISTING_DETAIL_SCROLLSPY_ITEMS } from "@/lib/listingDetailScrollspy";
import ListingDetailScrollNav from "@/components/sections/listing-detail/shared/ListingDetailScrollNav";
import ListingDetailScrollspySections from "@/components/sections/listing-detail/shared/ListingDetailScrollspySections";
import type { Car } from "@/types/cars";

type ListingDetailScrollspyProps = {
  showOverview?: boolean;
  car: Car;
};

export default function ListingDetailScrollspy({
  showOverview = true,
  car,
}: ListingDetailScrollspyProps) {
  const navRef = useRef<HTMLElement>(null);
  const { activeId, scrollToSection, registerSectionRef } = useScrollspy({
    items: LISTING_DETAIL_SCROLLSPY_ITEMS,
    navRef,
    stickyTopVar: "--listing-detail-sticky-top",
  });

  return (
    <ScrollspyProvider registerSectionRef={registerSectionRef}>
      <ListingDetailScrollNav
        navRef={navRef}
        activeId={activeId}
        onNavigate={scrollToSection}
      />
      <div className="scrollspy-example">
        <ListingDetailScrollspySections showOverview={showOverview} car={car} />
      </div>
    </ScrollspyProvider>
  );
}
