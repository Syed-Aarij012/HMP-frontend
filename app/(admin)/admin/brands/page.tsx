import { Metadata } from "next";
import Brands from "@/components/sections/super-admin/Brands";

export const metadata: Metadata = {
  title: "Brands | HMP Admin",
  description: "HMP Admin Panel",
};

export default function AdminBrandsPage() {
  return <Brands />;
}
