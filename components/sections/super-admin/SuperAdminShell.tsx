"use client";

import type { ReactNode } from "react";
import { PageHeader } from "@/components/admin/ui";

/**
 * §2.2 P7 — the header + body for each Admin Panel page. Navigation and the Super Admin check
 * live in the panel's layout (AdminLayoutClient); the backend's 'super-admin' middleware is what
 * actually enforces access.
 */
export default function SuperAdminShell({ title, intro, actions, eyebrow, children }: { title: string; intro?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; children: ReactNode }) {
  return (
    <>
      <PageHeader title={title} description={intro} actions={actions} eyebrow={eyebrow} />
      {children}
    </>
  );
}
