"use client";

import Link from "next/link";
import { useDealerStorefrontProfile } from "@/hooks/useDealerStorefrontProfile";
import { Card } from "@/components/ui/kit";

/**
 * FR-C-002 Dealer Dashboard: tells a dealership where its public profile is — the card shown in
 * the Dealer section and the page that lists all of its ads — and where to edit it. Renders
 * nothing for accounts without a storefront (private sellers).
 */
export default function DealerPageBanner({ adCount }: { adCount: number }) {
  const { storefront, isDealer } = useDealerStorefrontProfile();

  if (!isDealer || !storefront) return null;

  return (
    <Card
      className="mb-4"
      title={storefront.display_name}
      description={`Your dealer page shows buyers all ${adCount} of your live ads, and updates as soon as you change one.`}
      actions={
        <>
          <Link href={`/dealer-detail/${storefront.slug}`} className="ha-btn is-sm">
            View my dealer page
          </Link>
          <Link href="/my-profile" className="ha-btn is-sm is-ghost">
            Edit dealer profile
          </Link>
          <Link href="/add-listing" className="ha-btn is-sm is-ghost">
            Add an ad
          </Link>
        </>
      }
    >
      {null}
    </Card>
  );
}
