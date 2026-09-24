import { Metadata } from "next";
import Dashboard from "@/components/sections/my-bids/Dashboard";

export const metadata: Metadata = {
  title: "My Bids | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function MyBidsPage() {
  return <Dashboard />;
}
