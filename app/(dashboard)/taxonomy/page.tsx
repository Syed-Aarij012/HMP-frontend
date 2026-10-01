import { Metadata } from "next";
import TaxonomyAdmin from "@/components/sections/taxonomy/TaxonomyAdmin";

export const metadata: Metadata = {
  title: "Vehicle Taxonomy | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function TaxonomyPage() {
  return <TaxonomyAdmin />;
}
