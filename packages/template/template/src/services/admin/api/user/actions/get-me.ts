'use server'

import { createAction } from '@/lib/utils'
import type { User } from '@/services/admin/state/user'

/**
 * Get the current logged-in admin user.
 * TODO(auth-setup): Map session.user fields from getAdminServerSession().
 * Fetch separate member/business tables lazily through separate APIs/queries; do not join here.
 * Propagate session-read errors instead of converting them to anonymous null.
 */
async function _getMe(): Promise<User | null> {
  return {
    id: 'mock-admin-001',
    email: 'admin@example.com',
    name: '관리자',
    username: 'admin',
    displayUsername: 'Admin',
    image: null,
    emailVerified: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }
}

export const getMe = createAction(_getMe)
