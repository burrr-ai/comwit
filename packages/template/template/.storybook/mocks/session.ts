import type { User } from '../../src/services/admin/state/user'
import { adminRoutes } from '../../src/lib/admin-routes'

// The same fixed server-auth result is used by the layout and the getMe mock.
export function initialUserForPage(title: string, pathname?: string): User | null {
  if (!title.startsWith('어드민/') || pathname === adminRoutes.login) return null
  return {
    id: 'storybook-admin', name: '관리자', email: 'admin@example.com',
    emailVerified: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  }
}
