import { Metadata } from "next";
import FeatureFlags from "@/components/sections/super-admin/FeatureFlags";

export const metadata: Metadata = {
  title: "Feature Flags | HMP Admin",
  description: "HMP Admin Panel",
};

export default function SuperAdminFeatureFlagsPage() {
  return <FeatureFlags />;
}
