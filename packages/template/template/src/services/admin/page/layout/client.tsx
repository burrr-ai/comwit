'use client'

import { useAdminUser, type User } from '@/services/admin/state/user'
import { AdminLayoutContent } from './content'

export function AdminLayoutClient({ children, initialUser }: {
  children: React.ReactNode
  initialUser: User | null
}) {
  // This adapter does not subscribe to user state; children own subscriptions and UI.
  // Avoid rerendering after sign-out and replaying an outdated server seed.
  useAdminUser.hydrate({ me: { data: initialUser } })
  return <AdminLayoutContent>{children}</AdminLayoutContent>
}
