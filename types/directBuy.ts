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
  // Recorded on orders placed after the full pack was introduced; null on older orders.
  sellerName: string | null;
  balanceDue: number | null;
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
  // FR-C-030 handoff to Module F (FR-F-001/010) — set once the order is paid.
  transportJobId: number | null;
  releaseNoteId: number | null;
  collectionPostcode: string | null;
};
