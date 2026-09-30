import { Metadata } from "next";
import InspectionBuilder from "@/components/sections/inspections/InspectionBuilder";

export const metadata: Metadata = {
  title: "Vehicle Inspection | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InspectionPage({ params }: PageProps) {
  const { id } = await params;

  return <InspectionBuilder vehiclePublicId={id} />;
}
