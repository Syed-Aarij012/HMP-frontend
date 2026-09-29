// FR-C-030/FR-E-011: direct-buy (Buy Now) holding-deposit checkout.

import type { Car } from "@/types/cars";

export type RetailOrderStatus = "deposit_held" | "cancelled_cooling_off" | "confirmed" | "paid";

export type DistanceSellingDisclosure = {
  sellerType: string;
  goodsDescription: string;
  price: number;
  depositAmount: number;
  rightToCancelDays: number;
  cancellationDeadline: string;
  generatedAt: string;
};

export type RetailOrder = {
  id: number;
  publicId: string;
  listingId: string;
  status: RetailOrderStatus;
  depositAmount: number;
  coolingOffEndsAt: string | null;
  cancelledAt: string | null;
  balancePaidAt: string | null;
  disclosure: DistanceSellingDisclosure | null;
  car: Car | null;
};
