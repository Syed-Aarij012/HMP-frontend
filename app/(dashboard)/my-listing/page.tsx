import { Metadata } from "next";
import Dashboard from "@/components/sections/my-listing/Dashboard";
export const metadata: Metadata = {
  title:
    "My Listing | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};
export default async function MyListingPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const { submitted } = await searchParams;

  return (
    <>
              <Dashboard submitted={submitted === "1"} />
    </>
  );
}
