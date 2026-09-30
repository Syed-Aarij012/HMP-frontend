import { Metadata } from "next";
import GuidedCapture from "@/components/sections/guided-capture/GuidedCapture";

export const metadata: Metadata = {
  title: "Guided Photo Capture | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function GuidedCapturePage({ params }: PageProps) {
  const { id } = await params;

  return <GuidedCapture vehiclePublicId={id} />;
}
