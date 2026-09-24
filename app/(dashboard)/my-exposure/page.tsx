import { Metadata } from "next";
import Dashboard from "@/components/sections/my-exposure/Dashboard";

export const metadata: Metadata = {
  title: "My Exposure | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function MyExposurePage() {
  return <Dashboard />;
}
