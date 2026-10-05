import { Metadata } from "next";
import DealerGroup from "@/components/sections/dealer-group/DealerGroup";

export const metadata: Metadata = {
  title: "Dealer Group | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function DealerGroupPage() {
  return <DealerGroup />;
}
