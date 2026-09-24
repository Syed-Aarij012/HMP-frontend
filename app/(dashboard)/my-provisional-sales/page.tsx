import { Metadata } from "next";
import Dashboard from "@/components/sections/my-provisional-sales/Dashboard";

export const metadata: Metadata = {
  title: "Provisional Sales | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function MyProvisionalSalesPage() {
  return <Dashboard />;
}
