import { Metadata } from "next";
import RoutingRulesAdmin from "@/components/sections/routing-rules/RoutingRulesAdmin";

export const metadata: Metadata = {
  title: "Auto-routing Rules | HMP Admin",
  description: "HMP Admin Panel",
};

// The same operational tool staff use from their dashboard, inside the Admin Panel.
export default function AdminRoutingRulesAdminPage() {
  return <RoutingRulesAdmin />;
}
