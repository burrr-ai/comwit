import { fn } from 'storybook/test'
import type { AdminUserAPI } from '../../../src/services/admin/api/user'

export const adminUser = {
  getMe: fn<AdminUserAPI['getMe']>(async () => null),
} satisfies AdminUserAPI
