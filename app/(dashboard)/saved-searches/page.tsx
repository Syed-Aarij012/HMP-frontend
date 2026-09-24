import { Metadata } from "next";
import SavedSearches from "@/components/sections/saved-searches/SavedSearches";

export const metadata: Metadata = {
  title: "Saved Searches | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function SavedSearchesPage() {
  return <SavedSearches />;
}
