import { Metadata } from "next";
import Dashboard from "@/components/sections/dealer-analytics/Dashboard";

export const metadata: Metadata = {
  title: "Dealer Analytics | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function DealerAnalyticsPage() {
  return <Dashboard />;
}
