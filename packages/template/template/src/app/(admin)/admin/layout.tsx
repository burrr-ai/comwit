import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLayout } from "@/services/admin/page/layout";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

// Admin uses the shared design system (@/lib/components/ui + @comwit/ui); MUI/emotion were removed.
export default function Layout({ children }: { children: React.ReactNode }) {
  // Keep this before auth-setup: render admin UI after the basic session resolves.
  return (
    <Suspense fallback={null}>
      <AdminLayout>{children}</AdminLayout>
    </Suspense>
  );
}
