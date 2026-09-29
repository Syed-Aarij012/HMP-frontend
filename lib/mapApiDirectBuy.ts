import { mapApiListingToCar, type ApiListing } from "@/lib/mapApiListing";
import type { DistanceSellingDisclosure, RetailOrder } from "@/types/directBuy";

export type ApiDistanceSellingDisclosure = {
  seller_type: string;
  goods_description: string;
  price: string;
  deposit_amount: string;
  right_to_cancel_days: number;
  cancellation_deadline: string;
  generated_at: string;
};

export type ApiRetailOrder = {
  id: number;
  public_id: string;
  listing_id: string;
  status: RetailOrder["status"];
  deposit_amount: string;
  cooling_off_ends_at: string | null;
  cancelled_at: string | null;
  balance_paid_at: string | null;
  distance_selling_disclosure: ApiDistanceSellingDisclosure | null;
  listing?: ApiListing | null;
};

function mapDisclosure(api: ApiDistanceSellingDisclosure): DistanceSellingDisclosure {
  return {
    sellerType: api.seller_type,
    goodsDescription: api.goods_description,
    price: Number(api.price),
    depositAmount: Number(api.deposit_amount),
    rightToCancelDays: api.right_to_cancel_days,
    cancellationDeadline: api.cancellation_deadline,
    generatedAt: api.generated_at,
  };
}

export function mapApiRetailOrder(api: ApiRetailOrder): RetailOrder {
  return {
    id: api.id,
    publicId: api.public_id,
    listingId: api.listing_id,
    status: api.status,
    depositAmount: Number(api.deposit_amount),
    coolingOffEndsAt: api.cooling_off_ends_at,
    cancelledAt: api.cancelled_at,
    balancePaidAt: api.balance_paid_at,
    disclosure: api.distance_selling_disclosure ? mapDisclosure(api.distance_selling_disclosure) : null,
    car: api.listing ? mapApiListingToCar(api.listing) : null,
  };
}
