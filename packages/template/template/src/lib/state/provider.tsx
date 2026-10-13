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
      // Stream SSR-resolved .suspend() results into the browser cache to avoid hydration refetches.
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
