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

// 어드민도 공통 디자인 시스템(@/lib/components/ui + @comwit/ui)을 그대로 쓴다 — MUI/emotion 제거됨.
export default function Layout({ children }: { children: React.ReactNode }) {
  // auth-setup 연결 전에도 유지: 관리자 기본 세션이 준비된 뒤 UI를 렌더한다.
  return (
    <Suspense fallback={null}>
      <AdminLayout>{children}</AdminLayout>
    </Suspense>
  );
}
