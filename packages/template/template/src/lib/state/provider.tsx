"use client";

import { ComwitProvider } from "@comwit/state";
import { useRouter, useServerInsertedHTML } from "next/navigation";
import type { ReactNode } from "react";

export type AppContext = {
  router: { push: (href: string) => void };
};

export function StateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <ComwitProvider
      context={{ router }}
      // SSR 중 resolve된 .suspend() 결과를 브라우저 캐시로 스트리밍해 하이드레이션 재요청을 막는다.
      useServerInsertedHTML={useServerInsertedHTML}
      defaultOptions={{
        query: {
          staleTime: 0,
        },
      }}
    >
      {children}
    </ComwitProvider>
  );
}
