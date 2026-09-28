import { Metadata } from "next";
import ValuationTool from "@/components/sections/valuation-tool/ValuationTool";

export const metadata: Metadata = {
  title: "Free Car Valuation | HMP - Car Dealer, Rental & Listing",
  description: "Get a free, instant car valuation by VIN and mileage.",
};

export default function ValuationToolPage() {
  return <ValuationTool />;
}
