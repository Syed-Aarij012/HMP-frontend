import { Metadata } from "next";
import Dashboard from "@/components/sections/my-consigned-lots/Dashboard";

export const metadata: Metadata = {
  title: "My Consigned Vehicles | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function MyConsignedLotsPage() {
  return <Dashboard />;
}
