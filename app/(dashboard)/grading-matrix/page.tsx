import { Metadata } from "next";
import GradingMatrixAdmin from "@/components/sections/grading-matrix/GradingMatrixAdmin";

export const metadata: Metadata = {
  title: "Grading Matrix | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function GradingMatrixPage() {
  return <GradingMatrixAdmin />;
}
