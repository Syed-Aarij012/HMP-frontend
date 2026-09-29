import { Metadata } from "next";
import OrdersDashboard from "@/components/sections/my-orders/OrdersDashboard";

export const metadata: Metadata = {
  title: "My Orders | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function MyOrdersPage() {
  return <OrdersDashboard />;
}
