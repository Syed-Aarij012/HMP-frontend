import { Metadata } from "next";
import Approvals from "@/components/sections/super-admin/Approvals";

export const metadata: Metadata = {
  title: "Approvals | HMP Admin",
  description: "HMP Admin Panel",
};

export default function SuperAdminApprovalsPage() {
  return <Approvals />;
}
