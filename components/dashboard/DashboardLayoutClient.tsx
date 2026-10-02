"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/headers/DashboardHeader";
import DashboardSidebar from "@/components/headers/DashboardSidebar";
import DashboardOverlay from "@/components/dashboard/DashboardOverlay";
import { DashboardSidebarProvider } from "@/components/dashboard/DashboardSidebarContext";
import { useAuth } from "@/contexts/AuthContext";

type DashboardLayoutClientProps = {
  children: ReactNode;
};

export default function DashboardLayoutClient({
  children,
}: DashboardLayoutClientProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Sending a signed-out visitor to the public landing page (not /login) applies whether
    // they just logged out from here or landed on a dashboard URL without ever being signed
    // in — either way "/" is where they can sign back in from the header.
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return null;
  }

  return (
    <DashboardSidebarProvider>
      <DashboardOverlay />
      <DashboardSidebar />
      <div id="wrapper-dashboard">
        <div id="pagee" className="clearfix">
          <DashboardHeader />
        </div>
        {children}
      </div>
    </DashboardSidebarProvider>
  );
}
