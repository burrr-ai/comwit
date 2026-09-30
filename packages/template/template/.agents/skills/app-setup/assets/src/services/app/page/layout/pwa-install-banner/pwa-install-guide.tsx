'use client'

import { Button } from '@/lib/components/ui/button'
import {
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetTitle,
} from '@/lib/components/ui/bottom-sheet'
import { PWA_CONFIG } from '@/lib/pwa'

/** Uses the banner's local BottomSheet state. No URL, history entry or page transition rule. */
export function PwaInstallGuide({ method }: { method: 'native' | 'ios' | 'android' | null }) {
  const ios = method === 'ios'
  return (
    <BottomSheetContent className="max-w-md">
      <BottomSheetHeader>
        <BottomSheetTitle>{PWA_CONFIG.shortName}을 홈 화면에 추가</BottomSheetTitle>
        <BottomSheetDescription>아이콘을 눌러 앱을 바로 열 수 있어요.</BottomSheetDescription>
      </BottomSheetHeader>
      <div className="min-h-0 overflow-y-auto overscroll-contain">
        <ol className="list-inside list-decimal space-y-3 px-5 py-2 text-body text-foreground">
          {ios ? (
            <>
              <li>브라우저의 <strong>공유</strong> 메뉴를 여세요.</li>
              <li><strong>홈 화면에 추가</strong>를 선택하세요.</li>
              <li><strong>웹 앱으로 열기</strong>가 표시되면 켠 뒤 <strong>추가</strong>를 누르세요.</li>
            </>
          ) : (
            <>
              <li>브라우저 메뉴를 여세요.</li>
              <li><strong>앱 설치</strong> 또는 <strong>홈 화면에 추가</strong>를 선택하고 안내에 따라 추가하세요.</li>
            </>
          )}
        </ol>
        <p className="px-5 py-2 text-body-sm text-soft-foreground">
          메뉴가 없으면 {ios ? 'Safari' : 'Chrome'}에서 이 페이지를 열어보세요.
        </p>
      </div>
      <BottomSheetFooter>
        <BottomSheetClose asChild>
          <Button className="w-full">확인</Button>
        </BottomSheetClose>
      </BottomSheetFooter>
    </BottomSheetContent>
  )
}
