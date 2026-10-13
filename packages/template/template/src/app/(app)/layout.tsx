import { Suspense } from "react";
import { AppLayout } from "@/services/app/page/layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  // Keep this before auth-setup: the top-level basic-session boundary has an empty fallback.
  return (
    <Suspense fallback={null}>
      <AppLayout>{children}</AppLayout>
    </Suspense>
  );
}
