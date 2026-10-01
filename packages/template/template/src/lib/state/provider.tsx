"use client";

import { ComwitProvider } from "@comwit/state";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export type AppContext = {
  router: { push: (href: string) => void };
};

export function StateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <ComwitProvider
      context={{ router }}
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
