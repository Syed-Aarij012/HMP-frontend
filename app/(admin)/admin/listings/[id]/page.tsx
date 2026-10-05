import { Metadata } from "next";
import ListingReview from "@/components/sections/super-admin/ListingReview";

export const metadata: Metadata = {
  title: "Review Listing | HMP Admin",
  description: "HMP Admin Panel",
};

export default async function AdminListingReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ListingReview listingId={id} />;
}
