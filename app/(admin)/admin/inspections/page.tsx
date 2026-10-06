import { Metadata } from "next";
import InspectionAssignments from "@/components/sections/super-admin/InspectionAssignments";

export const metadata: Metadata = {
  title: "Inspection Assignments | HMP Admin",
  description: "HMP Admin Panel",
};

export default function AdminInspectionAssignmentsPage() {
  return <InspectionAssignments />;
}
