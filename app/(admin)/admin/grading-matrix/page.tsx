import { Metadata } from "next";
import GradingMatrixAdmin from "@/components/sections/grading-matrix/GradingMatrixAdmin";

export const metadata: Metadata = {
  title: "Grading Matrix | HMP Admin",
  description: "HMP Admin Panel",
};

// The same operational tool staff use from their dashboard, inside the Admin Panel.
export default function AdminGradingMatrixAdminPage() {
  return <GradingMatrixAdmin />;
}
