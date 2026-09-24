import { Metadata } from "next";
import Dashboard from "@/components/sections/bidding-deposits/Dashboard";

export const metadata: Metadata = {
  title: "Bidding Deposits | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function BiddingDepositsPage() {
  return <Dashboard />;
}
