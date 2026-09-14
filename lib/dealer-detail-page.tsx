import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { dealers, getDealerById, getDealerDetailTitle } from "@/data/dealers";
import { parseNumericRouteId } from "@/lib/routes";
import { apiFetch } from "@/lib/api-client";
import { mapApiDealerToDealer, type ApiDealer } from "@/lib/mapApiDealer";
import type { Dealer } from "@/types/dealers";

type DealerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export type DealerDetailSectionProps = {
  dealer: Dealer;
};

// A mock dealer is keyed by a small numeric id; a real one is keyed by its (never purely
// numeric) slug — the same "numeric mock vs non-numeric real" split lib/listing-detail-page
// uses, just with a slug standing in for a ULID.
async function resolveDealer(id: string): Promise<{ dealer: Dealer; title: string } | null> {
  const dealerId = parseNumericRouteId(id);

  if (dealerId !== null) {
    const dealer = getDealerById(dealerId);
    return dealer ? { dealer, title: getDealerDetailTitle(dealerId) } : null;
  }

  try {
    const response = await apiFetch<{ data: ApiDealer }>(`/dealers/${id}`, { auth: false });
    const dealer = mapApiDealerToDealer(response.data);
    return { dealer, title: dealer.name };
  } catch {
    return null;
  }
}

export function createDealerDetailPageConfig(
  Hero: ComponentType<{ dealer: Dealer }>,
  DealerDetail: ComponentType<DealerDetailSectionProps>,
) {
  function generateStaticParams() {
    return dealers.map((dealer) => ({ id: String(dealer.id) }));
  }

  async function generateMetadata({
    params,
  }: DealerDetailPageProps): Promise<Metadata> {
    const { id } = await params;
    const resolved = await resolveDealer(id);

    if (!resolved) {
      return {
        title: "Dealer Detail | HMP - Car Dealer, Rental & Listing",
      };
    }

    return {
      title: `${resolved.title} | HMP`,
      description: "HMP - Car Dealer, Rental & Listing",
    };
  }

  async function Page({ params }: DealerDetailPageProps) {
    const { id } = await params;
    const resolved = await resolveDealer(id);

    if (!resolved) {
      notFound();
    }

    const { dealer } = resolved;

    return (
      <>
        <Hero dealer={dealer} />
        <DealerDetail dealer={dealer} />
      </>
    );
  }

  return { generateStaticParams, generateMetadata, default: Page };
}
