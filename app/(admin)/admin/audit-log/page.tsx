import { Metadata } from "next";
import AuditLog from "@/components/sections/super-admin/AuditLog";

export const metadata: Metadata = {
  title: "Audit Log | HMP Admin",
  description: "HMP Admin Panel",
};

export default function SuperAdminAuditLogPage() {
  return <AuditLog />;
}
