import { Metadata } from "next";
import PricingOversight from "@/components/sections/super-admin/PricingOversight";

export const metadata: Metadata = {
  title: "Pricing Oversight | HMP Admin",
  description: "HMP Admin Panel",
};

export default function AdminPricingOversightPage() {
  return <PricingOversight />;
}
