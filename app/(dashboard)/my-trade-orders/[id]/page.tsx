import { Metadata } from "next";
import TradeOrderDetail from "@/components/sections/my-trade-orders/TradeOrderDetail";

export const metadata: Metadata = {
  title: "Trade Order | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TradeOrderPage({ params }: PageProps) {
  const { id } = await params;

  return <TradeOrderDetail id={Number(id)} />;
}
