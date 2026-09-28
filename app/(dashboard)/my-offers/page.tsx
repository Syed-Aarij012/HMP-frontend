import { Metadata } from "next";
import Dashboard from "@/components/sections/my-offers/Dashboard";

export const metadata: Metadata = {
  title: "My Offers | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function MyOffersPage() {
  return <Dashboard />;
}
