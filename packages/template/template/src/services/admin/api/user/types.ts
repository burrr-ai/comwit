import type { User } from '@/services/admin/state/user'

export interface AdminUserAPI {
  /** 현재 로그인한 어드민 사용자 정보 조회 */
  getMe: () => Promise<User | null>
}
