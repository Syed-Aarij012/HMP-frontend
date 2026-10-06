import { Metadata } from "next";
import Organizations from "@/components/sections/super-admin/Organizations";

export const metadata: Metadata = {
  title: "Organizations | HMP Admin",
  description: "HMP Admin Panel",
};

export default function SuperAdminOrganizationsPage() {
  return <Organizations />;
}
