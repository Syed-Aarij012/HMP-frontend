import type { ApiAuctionLotVehicle, ApiConditionReport } from "@/lib/mapApiAuction";
import { mapApiConditionReport } from "@/lib/mapApiAuction";
import type { TradeFixedPriceListing } from "@/types/tradeFixedPrice";

export type ApiTradeFixedPriceListing = {
  id: string;
  status: "active" | "sold" | "withdrawn";
  asking_price: string | number;
  buyers_premium: string | number | null;
  vat_on_premium: string | number | null;
  sold_at: string | null;
  withdrawn_at: string | null;
  created_at: string;
  vehicle?: ApiAuctionLotVehicle;
  condition_report?: ApiConditionReport;
};

export function mapApiTradeFixedPriceListing(listing: ApiTradeFixedPriceListing): TradeFixedPriceListing {
  return {
    id: listing.id,
    status: listing.status,
    askingPrice: Number(listing.asking_price),
    buyersPremium: listing.buyers_premium !== null && listing.buyers_premium !== undefined ? Number(listing.buyers_premium) : null,
    vatOnPremium: listing.vat_on_premium !== null && listing.vat_on_premium !== undefined ? Number(listing.vat_on_premium) : null,
    soldAt: listing.sold_at,
    withdrawnAt: listing.withdrawn_at,
    createdAt: listing.created_at,
    vehicle: listing.vehicle
      ? {
          id: listing.vehicle.id,
          make: listing.vehicle.make,
          model: listing.vehicle.model,
          derivative: listing.vehicle.derivative,
          bodyType: listing.vehicle.body_type,
          fuelType: listing.vehicle.fuel_type,
          transmission: listing.vehicle.transmission,
          colour: listing.vehicle.colour,
          year: listing.vehicle.year,
          mileage: listing.vehicle.current_mileage,
          photos: (listing.vehicle.photos ?? []).map((photo) => ({
            id: photo.id,
            type: photo.type,
            url: photo.url,
            is360: photo.is_360,
            sequence: photo.sequence,
          })),
        }
      : null,
    conditionReport: listing.condition_report ? mapApiConditionReport(listing.condition_report) : null,
  };
}
