'use client'

import { OverlayProvider } from 'overlay-kit'
import { Toaster } from '@comwit/ui-templates/toast'

/**
 * 전역 프로바이더 — base-template 의 RootLayoutClient 에서 StateProvider 만 제거한 형태.
 *  - OverlayProvider: popup.confirm / alert / sheet (overlay-kit)
 *  - Toaster: 유리 토스트(엔진 sonner)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <OverlayProvider>
      {children}
      <Toaster />
    </OverlayProvider>
  )
}
