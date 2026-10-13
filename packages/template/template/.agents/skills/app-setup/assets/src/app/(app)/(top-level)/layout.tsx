import type { ReactNode } from 'react'

import { TabShell } from '@/lib/components/ui/app-shell'

/**
 * (top-level) contains only screens reachable from BottomNav.
 * Each tab has a folder in this group and an entry in services/app/page/layout/app-tabs.ts.
 * All other screens belong in (detail).
 *
 * Tab changes replace the body while keeping the tab bar. The installed
 * @/lib/components/ui/app-shell provides the shell, transitions, and tab bar.
 * The outer shell is <AppShell tabs={APP_TABS}> in layout/client.tsx.
 */
export default function TopLevelLayout({ children }: { children: ReactNode }) {
  return <TabShell>{children}</TabShell>
}
