import { Metadata } from "next";
import Dashboard from "@/components/sections/trust-safety/Dashboard";

export const metadata: Metadata = {
  title: "Trust & Safety | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function TrustSafetyPage() {
  return <Dashboard />;
}
