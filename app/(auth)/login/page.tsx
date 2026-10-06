import { Suspense } from "react";
import { Metadata } from "next";
import AuthPage from "@/components/auth/AuthPage";

export const metadata: Metadata = {
  title: "Sign in | HMP - Car Dealer, Rental & Listing",
  description: "Sign in to HMP",
};

export default function LoginPage() {
  return (
    <Suspense>
      <AuthPage initialMode="signin" />
    </Suspense>
  );
}
