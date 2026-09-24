import { Metadata } from "next";
import Dashboard from "@/components/sections/my-trade-orders/Dashboard";

export const metadata: Metadata = {
  title: "My Trade Orders | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function MyTradeOrdersPage() {
  return <Dashboard />;
}
