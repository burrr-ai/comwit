'use client'

import { OverlayProvider } from 'overlay-kit'
import { StateProvider } from '@/lib/state'
import { Toaster } from '@/lib/components/ui/toast'

/**
 * RootLayoutClient Component
 *
 * Client-side root layout that handles global concerns only:
 * - State management (StateProvider/ComwitProvider)
 * - Overlay system (OverlayProvider for confirm/alert)
 * - Toast notifications (Toaster)
 *
 * User authentication is NOT handled here — each service layout handles its own.
 */
export function RootLayoutClient({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <StateProvider>
      <OverlayProvider>
        {children}
        <Toaster />
      </OverlayProvider>
    </StateProvider>
  )
}
