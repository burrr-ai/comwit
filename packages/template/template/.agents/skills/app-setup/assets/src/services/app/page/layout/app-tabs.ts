import { Home } from 'lucide-react'
import type { AppTab } from '@/lib/components/ui/tab-bar'

/**
 * 탭의 단일 출처 — `layout/client.tsx`의 `<AppShell tabs={APP_TABS}>`에 넘긴다.
 * 배열 순서가 탭바 순서이자 탭 전환 방향이다. 다른 곳에 탭 목록을 다시 쓰지 않는다.
 * 탭 하나 = `src/app/(app)/(top-level)/` 안의 page.tsx 하나.
 */
export const APP_TABS: readonly AppTab[] = [
  { href: '/', label: '홈', icon: Home },
]

export const APP_TAB_PATHS: readonly string[] = APP_TABS.map((tab) => tab.href)
