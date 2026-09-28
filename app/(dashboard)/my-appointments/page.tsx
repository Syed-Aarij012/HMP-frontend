import { Metadata } from "next";
import Dashboard from "@/components/sections/my-appointments/Dashboard";

export const metadata: Metadata = {
  title: "My Appointments | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};

export default function MyAppointmentsPage() {
  return <Dashboard />;
}
