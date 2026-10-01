'use client'

import { useRouter } from 'next/navigation'
import { LayoutDashboard, UserRoundCog } from 'lucide-react'

import { BrandMark } from '@/lib/components/brand-mark'
import { adminRoutes } from '@/lib/admin-routes'
import { useAdminUser } from '@/services/admin/state/user'
import { AdminShell, type AdminNavGroup } from '@/services/admin/_components'

// TODO: 실제 메뉴에 맞게 그룹/항목 추가 — 그룹 라벨은 사이드바에 대문자로 노출된다.
//   { label: '운영', items: [{ label, href, icon }, ...] }, { label: '설정', items: [...] }
const navGroups: AdminNavGroup[] = [
  {
    label: '운영',
    items: [{ label: '대시보드', href: adminRoutes.dashboard, icon: LayoutDashboard }],
  },
  {
    label: '설정',
    items: [{ label: '내 계정', href: adminRoutes.account, icon: UserRoundCog }],
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

/** 사용자 구독과 UI는 hydration adapter의 자식에서만 처리한다. */
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
