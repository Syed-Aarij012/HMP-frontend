import { Metadata } from "next";
import Dashboard from "@/components/sections/auction-catalog/Dashboard";

export const metadata: Metadata = {
  title: "Auction Catalog | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function AuctionCatalogPage() {
  return <Dashboard />;
}
