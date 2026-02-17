'use client'

import { ComwitProvider } from 'comwit'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ComwitProvider
      defaultOptions={{
        query: {
          staleTime: 60_000,
        },
      }}
    >
      <Toaster />
      {children}
    </ComwitProvider>
  )
}
