'use server'

import { createAction } from '@/lib/utils'
import type { User } from '@/services/app/state/user'

/**
 * 기본 로그인 여부와 Better Auth 사용자 프로필만 반환한다.
 * TODO(auth-setup): mock을 아래 세션 조회 및 User 필드 매핑으로 교체한다.
 *   const session = await getAppServerSession() // @/server/auth/app
 *   if (!session?.user) return null
 * 별도 회원/프로필 테이블은 별도 API/query로 지연 조회한다. 여기서 조인하지 않는다.
 * 세션 조회 오류는 전파하며 비로그인(null)으로 바꾸지 않는다.
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
