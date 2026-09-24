import { Metadata } from "next";
import Security from "@/components/sections/security/Security";

export const metadata: Metadata = {
  title: "Security | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function SecurityPage() {
  return <Security />;
}
