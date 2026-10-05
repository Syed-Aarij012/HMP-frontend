import { Metadata } from "next";
import Listings from "@/components/sections/super-admin/Listings";

export const metadata: Metadata = {
  title: "Listing Moderation | HMP Admin",
  description: "HMP Admin Panel",
};

export default function SuperAdminListingsPage() {
  return <Listings />;
}
