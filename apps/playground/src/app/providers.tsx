'use client'

import { MuchaProvider } from 'muchajs'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MuchaProvider
      defaultOptions={{
        query: {
          staleTime: 60_000,
        },
      }}
    >
      <Toaster />
      {children}
    </MuchaProvider>
  )
}
