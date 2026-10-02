import { Metadata } from "next";
import Dashboard from "@/components/sections/leads/Dashboard";

export const metadata: Metadata = {
  title: "Leads | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function LeadsPage() {
  return <Dashboard />;
}
