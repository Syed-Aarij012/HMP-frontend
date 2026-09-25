import { Metadata } from "next";
import LiveLanes from "@/components/sections/live-lanes/LiveLanes";

export const metadata: Metadata = {
  title: "Live Lanes | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function LiveLanesPage() {
  return <LiveLanes />;
}
