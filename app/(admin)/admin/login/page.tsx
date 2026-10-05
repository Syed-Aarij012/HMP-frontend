import { Metadata } from "next";
import AdminLogin from "@/components/admin/AdminLogin";

export const metadata: Metadata = {
  title: "Sign in | HMP Admin",
  description: "HMP Admin Panel",
};

export default function AdminLoginPage() {
  return <AdminLogin />;
}
