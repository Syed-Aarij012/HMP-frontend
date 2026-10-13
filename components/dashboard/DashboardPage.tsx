"use client";

import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/kit";

/**
 * The frame every dashboard page sits in: one heading level-1 title, an optional one-line
 * description and the page's primary actions, top-right. The shell (sidebar, top bar, padding)
 * comes from DashboardLayoutClient; inside the Admin Panel the same page renders embedded.
 */
export default function DashboardPage({ title, description, actions, eyebrow, children }: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="hd-page">
      <PageHeader title={title} description={description} actions={actions} eyebrow={eyebrow} />
      {children}
    </div>
  );
}
