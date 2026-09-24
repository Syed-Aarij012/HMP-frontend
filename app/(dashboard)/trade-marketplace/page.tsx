import { Metadata } from "next";
import TradeMarketplace from "@/components/sections/trade-marketplace/TradeMarketplace";

export const metadata: Metadata = {
  title: "Trade Marketplace | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function TradeMarketplacePage() {
  return <TradeMarketplace />;
}
