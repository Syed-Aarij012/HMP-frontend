import { Metadata } from "next";
import InspectionLookup from "@/components/sections/inspections/InspectionLookup";

export const metadata: Metadata = {
  title: "Vehicle Inspection | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function InspectionsPage() {
  return <InspectionLookup />;
}
