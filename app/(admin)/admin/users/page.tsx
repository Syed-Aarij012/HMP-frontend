import { Metadata } from "next";
import Users from "@/components/sections/super-admin/Users";

export const metadata: Metadata = {
  title: "Users & Roles | HMP Admin",
  description: "HMP Admin Panel",
};

export default function SuperAdminUsersPage() {
  return <Users />;
}
