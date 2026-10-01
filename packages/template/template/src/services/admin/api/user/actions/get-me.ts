'use server'

import { createAction } from '@/lib/utils'
import type { User } from '@/services/admin/state/user'

/**
 * Get current logged-in admin user
 * TODO(auth-setup): getAdminServerSession()의 session.user 필드 매핑으로 교체한다.
 * 별도 회원/업무 테이블은 별도 API/query로 지연 조회한다. 여기서 조인하지 않는다.
 * 세션 조회 오류는 전파하며 비로그인(null)으로 바꾸지 않는다.
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
