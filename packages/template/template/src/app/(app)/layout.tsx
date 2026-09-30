import { Suspense } from "react";
import { AppLayout } from "@/services/app/page/layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  // auth-setup 연결 전에도 유지: 기본 세션을 기다리는 최상단 경계는 빈 fallback을 쓴다.
  return (
    <Suspense fallback={null}>
      <AppLayout>{children}</AppLayout>
    </Suspense>
  );
}
