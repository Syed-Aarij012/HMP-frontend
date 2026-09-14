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
    if (!loading && !user) {
      router.replace("/login");
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
