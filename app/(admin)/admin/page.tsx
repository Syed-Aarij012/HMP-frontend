import { Metadata } from "next";
import Overview from "@/components/sections/super-admin/Overview";

export const metadata: Metadata = {
  title: "Super Admin | HMP Admin",
  description: "HMP Admin Panel",
};

export default function SuperAdminOverviewPage() {
  return <Overview />;
}
