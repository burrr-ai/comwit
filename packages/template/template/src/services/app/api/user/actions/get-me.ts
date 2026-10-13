'use server'

import { createAction } from '@/lib/utils'
import type { User } from '@/services/app/state/user'

/**
 * Return only basic sign-in status and the Better Auth user profile.
 * TODO(auth-setup): Replace this mock with session reads and User field mapping:
 *   const session = await getAppServerSession() // @/server/auth/app
 *   if (!session?.user) return null
 * Fetch separate member/profile tables lazily through separate APIs/queries; do not join here.
 * Propagate session-read errors instead of converting them to anonymous null.
 */
async function _getMe(): Promise<User | null> {
  // Mock user - remove after auth setup
  return {
    id: 'mock-user-001',
    email: 'test@example.com',
    name: '테스트 유저',
    username: 'testuser',
    displayUsername: 'TestUser',
    image: null,
    emailVerified: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }
}

export const getMe = createAction(_getMe)
