"use client";

import Link from "next/link";
import { useDealerStorefrontProfile } from "@/hooks/useDealerStorefrontProfile";

/**
 * FR-C-002 Dealer Dashboard: tells a dealership where its public profile is — the card shown in
 * the Dealer section and the page that lists all of its ads — and where to edit it. Renders
 * nothing for accounts without a storefront (private sellers).
 */
export default function DealerPageBanner({ adCount }: { adCount: number }) {
  const { storefront, isDealer } = useDealerStorefrontProfile();

  if (!isDealer || !storefront) return null;

  return (
    <div className="tfcl-card p-3 mb-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
      <div>
        <h5 className="mb-1">{storefront.display_name}</h5>
        <div className="text-color-1 fs-14">
          Your dealer page shows buyers all {adCount} of your ads. Add, edit or remove ads below and it updates straight away.
        </div>
      </div>
      <div className="d-flex gap-2 flex-wrap">
        <Link href={`/dealer-detail/${storefront.slug}`} className="sc-button">
          <span>View my dealer page</span>
        </Link>
        <Link href="/my-profile" className="sc-button">
          <span>Edit dealer profile</span>
        </Link>
        <Link href="/add-listing" className="sc-button">
          <span>Add an ad</span>
        </Link>
      </div>
    </div>
  );
}
