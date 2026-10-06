import { Metadata } from "next";
import Team from "@/components/sections/team/Team";

export const metadata: Metadata = {
  title: "Team & Roles | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function TeamPage() {
  return <Team />;
}
