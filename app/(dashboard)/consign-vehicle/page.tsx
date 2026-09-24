import { Metadata } from "next";
import ConsignVehicle from "@/components/sections/consign-vehicle/ConsignVehicle";

export const metadata: Metadata = {
  title: "Consign a Vehicle | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function ConsignVehiclePage() {
  return <ConsignVehicle />;
}
