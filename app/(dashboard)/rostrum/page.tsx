import { Metadata } from "next";
import Console from "@/components/sections/rostrum/Console";

export const metadata: Metadata = {
  title: "Rostrum Console | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function RostrumPage() {
  return <Console />;
}
