import { Metadata } from "next";
import LotDetail from "@/components/sections/auction-lot/LotDetail";

export const metadata: Metadata = {
  title: "Auction Lot | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AuctionLotPage({ params }: PageProps) {
  const { id } = await params;

  return <LotDetail publicId={id} />;
}
