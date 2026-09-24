import type { AuctionLotVehicle, ConditionReport } from "@/types/auction";

// FR-A-030 (M): the Fixed-Price Trade ("Buy Now") channel — a trade buyer instantly
// purchases a consigned vehicle at the consignor's asking price, no bidding.
export type TradeFixedPriceListing = {
  id: string;
  status: "active" | "sold" | "withdrawn";
  askingPrice: number;
  buyersPremium: number | null;
  vatOnPremium: number | null;
  soldAt: string | null;
  withdrawnAt: string | null;
  createdAt: string;
  vehicle: AuctionLotVehicle | null;
  conditionReport: ConditionReport | null;
};
