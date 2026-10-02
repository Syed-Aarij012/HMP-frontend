import { Metadata } from "next";
import Dashboard from "@/components/sections/subscription/Dashboard";

export const metadata: Metadata = {
  title: "Subscription | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function SubscriptionPage() {
  return <Dashboard />;
}
