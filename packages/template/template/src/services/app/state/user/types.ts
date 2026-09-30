import type { Query } from '@comwit/state'

// Better-auth user type
export type User = {
  id: string
  email: string
  name: string
  username?: string | null
  displayUsername?: string | null
  image?: string | null
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * User state
 */
export type UserState = {
  /** Better Auth 기본 프로필. 레이아웃에서 hydrate하며 null은 확인된 비로그인이다. */
  me: Query<User | null>
  /** 로그인/가입/로그아웃 액션의 진행 상태 (초기 세션 로딩과 별개). */
  isLoading: boolean
}

/**
 * User actions
 */
export type UserActions = {
  /** Sign in with username and password */
  signIn: (args: {username: string, password: string}) => Promise<void>
  /** Sign up with email, username, name, and password */
  signUp: (args: {email: string, username: string, name: string, password: string}) => Promise<void>
  /** Sign out */
  signOut: () => Promise<void>
}

/**
 * Internal actions (for cross-domain dependencies)
 */
export type InternalUserActions = UserActions
