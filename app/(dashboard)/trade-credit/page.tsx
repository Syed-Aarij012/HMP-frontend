import { Metadata } from "next";
import TradeCredit from "@/components/sections/trade-credit/TradeCredit";

export const metadata: Metadata = {
  title: "Trade Credit | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function TradeCreditPage() {
  return <TradeCredit />;
}
