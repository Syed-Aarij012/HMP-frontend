import { Metadata } from "next";
import SupportConsole from "@/components/sections/super-admin/SupportConsole";

export const metadata: Metadata = {
  title: "Support View | HMP Admin",
  description: "HMP Admin Panel",
};

export default function AdminSupportConsolePage() {
  return <SupportConsole />;
}
