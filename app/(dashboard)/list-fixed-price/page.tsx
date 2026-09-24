import { Metadata } from "next";
import ListFixedPrice from "@/components/sections/list-fixed-price/ListFixedPrice";

export const metadata: Metadata = {
  title: "List at Fixed Price | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function ListFixedPricePage() {
  return <ListFixedPrice />;
}
