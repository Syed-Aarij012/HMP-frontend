import { Metadata } from "next";
import DealerGroups from "@/components/sections/super-admin/DealerGroups";

export const metadata: Metadata = {
  title: "Dealer Groups | HMP Admin",
  description: "HMP Admin Panel",
};

export default function AdminDealerGroupsPage() {
  return <DealerGroups />;
}
