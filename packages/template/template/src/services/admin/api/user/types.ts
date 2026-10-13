import type { User } from '@/services/admin/state/user'

export interface AdminUserAPI {
  /** Get the current logged-in admin user. */
  getMe: () => Promise<User | null>
}
