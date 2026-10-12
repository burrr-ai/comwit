import { fn } from 'storybook/test'
import type { UserAPI } from '../../../src/services/app/api/user'

// Type-only imports preserve the contract without loading server actions.
export const user = {
  getMe: fn<UserAPI['getMe']>(async () => null),
} satisfies UserAPI
