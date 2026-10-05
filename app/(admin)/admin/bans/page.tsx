import { Metadata } from "next";
import Bans from "@/components/sections/super-admin/Bans";

export const metadata: Metadata = {
  title: "Bans | HMP Admin",
  description: "HMP Admin Panel",
};

export default function AdminBansPage() {
  return <Bans />;
}
