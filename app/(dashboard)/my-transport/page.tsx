import { Metadata } from "next";
import Dashboard from "@/components/sections/my-transport/Dashboard";

export const metadata: Metadata = {
  title: "My Transport | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function MyTransportPage() {
  return <Dashboard />;
}
