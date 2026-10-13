'use client'

import { useUser, type User } from '@/services/app/state/user'

/**
 * AppLayoutClient Component
 *
 * App service client layout:
 * - Hydrate server-resolved basic user data before the first state read.
 * - Render app UI such as the header and navigation.
 *
 * TODO: Add app UI such as header, sidebar, and footer.
 */
export function AppLayoutClient({ children, initialUser }: {
  children: React.ReactNode
  initialUser: User | null
}) {
  // Do not subscribe to user state in this adapter; children own subscriptions and UI.
  // null is a successful confirmed anonymous result; do not skip it with hydrate(null).
  useUser.hydrate({ me: { data: initialUser } })

  return <>{children}</>
}
