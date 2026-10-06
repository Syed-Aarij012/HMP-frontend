import { Metadata } from "next";
import TrustSafety from "@/components/sections/trust-safety/Dashboard";

export const metadata: Metadata = {
  title: "Trust & Safety | HMP Admin",
  description: "HMP Admin Panel",
};

// The same operational tool staff use from their dashboard, inside the Admin Panel.
export default function AdminTrustSafetyPage() {
  return <TrustSafety />;
}
