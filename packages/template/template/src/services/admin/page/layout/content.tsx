'use client'

import { useRouter } from 'next/navigation'
import { LayoutDashboardIcon, UserRoundCogIcon } from '@comwit/ui/icons'

import { BrandMark } from '@/lib/components/brand-mark'
import { adminRoutes } from '@/lib/admin-routes'
import { useAdminUser } from '@/services/admin/state/user'
import { AdminShell, type AdminNavGroup } from '@/services/admin/_components'

// TODO: Add real menu groups/items; group labels display uppercase in the sidebar.
//   { label: 'Operations', items: [{ label, href, icon }, ...] }, { label: 'Settings', items: [...] }
const navGroups: AdminNavGroup[] = [
  {
    label: '운영',
    items: [{ label: '대시보드', href: adminRoutes.dashboard, icon: LayoutDashboardIcon }],
  },
  {
    label: '설정',
    items: [{ label: '내 계정', href: adminRoutes.account, icon: UserRoundCogIcon }],
  },
]

const adminBrand = (
  <span className="flex items-center gap-1.5">
    <BrandMark size={28} />
    <span className="text-title-md leading-none font-bold text-foreground">
      Admin
    </span>
  </span>
)

/** Keep user subscriptions and UI in children of the hydration adapter. */
export function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const adminUser = useAdminUser((state) => ({ actions: state.actions }))

  async function handleSignOut() {
    await adminUser.actions.signOut()
    router.push(adminRoutes.login)
  }

  return (
    <AdminShell
      brand={adminBrand}
      navGroups={navGroups}
      homeHref={adminRoutes.dashboard}
      onSignOut={handleSignOut}
    >
      {children}
    </AdminShell>
  )
}
