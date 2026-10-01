import type { User } from '@/services/app/state/user'

export interface UserAPI {
  /** 현재 로그인한 사용자 정보 조회 */
  getMe: () => Promise<User | null>
}
