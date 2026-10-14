import { HouseIcon } from '@comwit/ui/icons'
import type { AppTab } from '@/lib/components/ui/tab-bar'

/**
 * The single tab definition, passed to <AppShell tabs={APP_TABS}> in layout/client.tsx.
 * Array order controls tab order and transition direction; do not duplicate this list.
 * Each tab corresponds to a page.tsx under src/app/(app)/(top-level)/.
 */
export const APP_TABS: readonly AppTab[] = [
  { href: '/', label: '홈', icon: HouseIcon },
]

export const APP_TAB_PATHS: readonly string[] = APP_TABS.map((tab) => tab.href)
