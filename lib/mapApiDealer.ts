import type { Dealer } from "@/types/dealers";

// A real dealer routes by its slug (see lib/dealer-detail-page.tsx's numeric-mock vs
// non-numeric-real split); a mock dealer keeps routing by its plain numeric id.
export function getDealerHref(dealer: Dealer): string {
  return `/dealer-detail/${dealer.slug ?? dealer.id}`;
}

export type ApiDealer = {
  id: number;
  slug: string;
  display_name: string;
  description?: string | null;
  logo_url?: string | null;
  tracked_phone_number?: string | null;
  created_at?: string | null;
  organization: { id: number; name: string } | null;
  rooftop: {
    name?: string;
    address_line1?: string;
    address_line2?: string | null;
    city?: string;
    postcode?: string;
    country?: string;
    phone?: string;
  } | null;
  listings_count?: number;
  average_rating?: number;
  review_count?: number;
};

export type ApiDealersResponse = {
  data: ApiDealer[];
};

// The backend has no dealer photo/logo of its own yet — cycle through the template's
// bundled dealer imagery, same placeholder approach as mapApiListingToCar's car photos.
const DEALER_PHOTO_COUNT = 16;

export function mapApiDealerToDealer(dealer: ApiDealer): Dealer {
  const rooftop = dealer.rooftop;
  const address = [rooftop?.address_line1, rooftop?.city, rooftop?.postcode]
    .filter(Boolean)
    .join(", ");
  const photoNumber = (dealer.id % DEALER_PHOTO_COUNT) + 1;
  const image = `/assets/images/section/dealer-list${photoNumber}.webp`;

  return {
    id: dealer.id,
    name: dealer.display_name,
    image,
    logo: dealer.logo_url || image,
    description: dealer.description ?? null,
    reviewCount: dealer.review_count ?? 0,
    rating: dealer.average_rating ?? 0,
    phone: rooftop?.phone ?? dealer.tracked_phone_number ?? "",
    address: address || "Address not available",
    state: rooftop?.city ?? "",
    brand: "Multi-Brand",
    dateAdded: dealer.created_at ?? new Date().toISOString(),
    slug: dealer.slug,
    organizationId: dealer.organization?.id,
  };
}
