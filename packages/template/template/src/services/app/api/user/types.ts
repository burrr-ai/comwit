import type { User } from '@/services/app/state/user'

export interface UserAPI {
  /** Get the current logged-in user. */
  getMe: () => Promise<User | null>
}
