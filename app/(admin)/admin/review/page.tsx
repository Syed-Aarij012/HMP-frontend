import { Metadata } from "next";
import ReviewQueue from "@/components/sections/super-admin/ReviewQueue";

export const metadata: Metadata = {
  title: "Listing Review | HMP Admin",
  description: "HMP Admin Panel",
};

export default function AdminReviewQueuePage() {
  return <ReviewQueue />;
}
