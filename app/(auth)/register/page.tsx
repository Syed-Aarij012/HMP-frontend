import { Suspense } from "react";
import { Metadata } from "next";
import AuthPage from "@/components/auth/AuthPage";

export const metadata: Metadata = {
  title: "Create account | HMP - Car Dealer, Rental & Listing",
  description: "Create an HMP account — buyer, seller, trade buyer or dealership",
};

export default function RegisterPage() {
  return (
    <Suspense>
      <AuthPage initialMode="signup" />
    </Suspense>
  );
}
