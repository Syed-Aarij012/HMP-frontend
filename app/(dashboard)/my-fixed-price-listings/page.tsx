import { Metadata } from "next";
import Dashboard from "@/components/sections/my-fixed-price-listings/Dashboard";

export const metadata: Metadata = {
  title: "My Fixed-Price Listings | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function MyFixedPriceListingsPage() {
  return <Dashboard />;
}
