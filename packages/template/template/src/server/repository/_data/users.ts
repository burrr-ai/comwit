import 'server-only'

/** Mock users. TODO: Remove after integrating real authentication. */

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
