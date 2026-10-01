import 'server-only'

/**
 * Mock Users
 *
 * TODO: 실제 인증 연동 후 삭제 필요
 */

import type { User } from '@/services/app/state/user'

export const MOCK_USER: User = {
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
