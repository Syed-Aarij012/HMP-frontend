import { Metadata } from "next";
import Dashboard from "@/components/sections/my-payouts/Dashboard";

export const metadata: Metadata = {
  title: "My Payouts | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function MyPayoutsPage() {
  return <Dashboard />;
}
