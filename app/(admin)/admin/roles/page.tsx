import { Metadata } from "next";
import Roles from "@/components/sections/super-admin/Roles";

export const metadata: Metadata = {
  title: "Role Matrix | HMP Admin",
  description: "HMP Admin Panel",
};

export default function SuperAdminRolesPage() {
  return <Roles />;
}
