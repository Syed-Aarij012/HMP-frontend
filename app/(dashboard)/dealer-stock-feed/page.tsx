import { Metadata } from "next";
import DealerStockFeedDashboard from "@/components/sections/dealer-stock-feed/DealerStockFeedDashboard";

export const metadata: Metadata = {
  title: "Bulk Stock Upload | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function DealerStockFeedPage() {
  return <DealerStockFeedDashboard />;
}
