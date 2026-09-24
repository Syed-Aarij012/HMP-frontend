import { Metadata } from "next";
import Dashboard from "@/components/sections/my-proxy-bids/Dashboard";

export const metadata: Metadata = {
  title: "My Proxy Bids | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function MyProxyBidsPage() {
  return <Dashboard />;
}
