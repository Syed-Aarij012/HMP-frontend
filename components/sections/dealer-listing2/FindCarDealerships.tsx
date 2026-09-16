import { Suspense } from "react";
import DealerListingContent from "@/components/sections/dealer-listing/DealerListingContent";

function FindCarDealerships() {
  return (
    <Suspense fallback={null}>
      <DealerListingContent />
    </Suspense>
  );
}

export default FindCarDealerships;
