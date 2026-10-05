import { Metadata } from "next";
import TaxonomyAdmin from "@/components/sections/taxonomy/TaxonomyAdmin";

export const metadata: Metadata = {
  title: "Taxonomy | HMP Admin",
  description: "HMP Admin Panel",
};

// The same operational tool staff use from their dashboard, inside the Admin Panel.
export default function AdminTaxonomyAdminPage() {
  return <TaxonomyAdmin />;
}
