'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Download, Share, X } from 'lucide-react'
import { Button } from '@/lib/components/ui/button'
import { BottomSheet, BottomSheetTrigger } from '@/lib/components/ui/bottom-sheet'
import { PWA_CONFIG } from '@/lib/pwa'
import { usePwaInstall } from '@/lib/pwa/client'
import { APP_TAB_PATHS } from '../app-tabs'
import { PwaInstallGuide } from './pwa-install-guide'

/** Main tabs only. The strip stays in flow; the guide is a local bottom sheet. */
export function PwaInstallBanner() {
  const pwa = usePwaInstall()
  const pathname = usePathname()
  if (!pwa.shouldShow || !pathname || !APP_TAB_PATHS.includes(pathname)) return null

  // Route changes/hidden banners unmount the local sheet, so it cannot reopen on Back.
  return <InstallBannerContent key={pathname} pwa={pwa} />
}

function InstallBannerContent({ pwa }: { pwa: ReturnType<typeof usePwaInstall> }) {
  const [showGuide, setShowGuide] = useState(false)
  const native = pwa.method === 'native'

  const install = async () => {
    if (!native) { setShowGuide(true); return }
    if (await pwa.promptInstall() === 'unavailable') setShowGuide(true)
  }

  return (
    <BottomSheet open={showGuide} onOpenChange={setShowGuide}>
      <aside data-pwa-install-banner aria-label="앱 설치 안내" className="shrink-0 border-b border-border bg-accent pt-[env(safe-area-inset-top)] text-accent-foreground">
        <div className="flex items-center gap-2 px-3 py-1">
          <img src="/pwa/icon-192.png" width={28} height={28} alt="" className="size-7 shrink-0 rounded-md" />
          <p className="min-w-0 flex-1 text-label">{PWA_CONFIG.shortName}을 홈 화면에 추가하세요</p>
          <BottomSheetTrigger asChild>
            <Button size="sm" onClick={(event) => { event.preventDefault(); void install() }} disabled={pwa.pending}>
              {native ? <Download aria-hidden="true" /> : <Share aria-hidden="true" />}
              {pwa.pending ? '확인 중' : native ? '설치' : '추가 방법'}
            </Button>
          </BottomSheetTrigger>
          <Button variant="ghost" size="icon" className="size-11" onClick={pwa.dismiss} aria-label="설치 안내 닫기"><X aria-hidden="true" /></Button>
        </div>
      </aside>
      <PwaInstallGuide method={pwa.method} />
    </BottomSheet>
  )
}
