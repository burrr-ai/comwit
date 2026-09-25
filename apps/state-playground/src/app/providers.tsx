'use client'

import { ComwitProvider } from '@comwit/state'
import { useServerInsertedHTML } from 'next/navigation'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ComwitProvider
      // Streams `.suspend()` results resolved during SSR into the browser cache (see /suspend).
      useServerInsertedHTML={useServerInsertedHTML}
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
