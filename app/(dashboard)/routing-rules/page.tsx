import { Metadata } from "next";
import RoutingRulesAdmin from "@/components/sections/routing-rules/RoutingRulesAdmin";

export const metadata: Metadata = {
  title: "Auto-Routing Rules | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function RoutingRulesPage() {
  return <RoutingRulesAdmin />;
}
