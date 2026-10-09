import { Metadata } from "next";
import Dashboard from "@/components/sections/gate-release/Dashboard";

export const metadata: Metadata = {
  title: "Vehicle Release | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function GateReleasePage() {
  return <Dashboard />;
}
