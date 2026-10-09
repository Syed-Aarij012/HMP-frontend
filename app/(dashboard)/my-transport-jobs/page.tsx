import { Metadata } from "next";
import Dashboard from "@/components/sections/my-transport-jobs/Dashboard";

export const metadata: Metadata = {
  title: "My Transport Jobs | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function MyTransportJobsPage() {
  return <Dashboard />;
}
