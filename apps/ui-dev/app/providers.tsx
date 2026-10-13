'use client'

import { OverlayProvider } from 'overlay-kit'
import { Toaster } from '@comwit/ui-templates/toast'

/**
 * Global providers mirror the base template's RootLayoutClient without StateProvider: OverlayProvider for popup.confirm/alert/sheet, and Toaster for glass notifications powered by sonner.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <OverlayProvider>
      {children}
      <Toaster />
    </OverlayProvider>
  )
}
