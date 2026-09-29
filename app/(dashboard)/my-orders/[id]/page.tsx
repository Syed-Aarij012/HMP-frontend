import { Metadata } from "next";
import OrderDetail from "@/components/sections/my-orders/OrderDetail";

export const metadata: Metadata = {
  title: "Order Details | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MyOrderPage({ params }: PageProps) {
  const { id } = await params;

  return <OrderDetail publicId={id} />;
}
