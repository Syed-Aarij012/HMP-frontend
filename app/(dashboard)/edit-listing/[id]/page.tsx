import { Metadata } from "next";
import EditListing from "@/components/sections/edit-listing/EditListing";

export const metadata: Metadata = {
  title: "Edit Listing | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <EditListing listingId={id} />;
}
