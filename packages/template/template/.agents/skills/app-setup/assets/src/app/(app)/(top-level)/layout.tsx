import type { ReactNode } from 'react'

import { TabShell } from '@/lib/components/ui/app-shell'

/**
 * (top-level) — BottomNav로 갈 수 있는 화면만 둔다.
 * 탭 하나 = 이 그룹의 폴더 하나 + `services/app/page/layout/app-tabs.ts` 항목 하나.
 * 탭이 아닌 화면은 전부 `(detail)`로 간다.
 *
 * 탭끼리는 본문만 바뀌고 탭바는 그대로 선다 — 셸·전환·탭바는 `@/lib/components/ui/app-shell`
 * 설치본이 맡는다. 바깥 셸은 `layout/client.tsx`의 `<AppShell tabs={APP_TABS}>`다.
 */
export default function TopLevelLayout({ children }: { children: ReactNode }) {
  return <TabShell>{children}</TabShell>
}
