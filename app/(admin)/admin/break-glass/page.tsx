import { Metadata } from "next";
import BreakGlass from "@/components/sections/super-admin/BreakGlass";

export const metadata: Metadata = {
  title: "Break-glass | HMP Admin",
  description: "HMP Admin Panel",
};

export default function SuperAdminBreakGlassPage() {
  return <BreakGlass />;
}
