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
  /** Basic Better Auth profile, hydrated by the layout; null means confirmed anonymous. */
  me: Query<User | null>
  /** Progress of sign-in, sign-up, and sign-out actions, separate from initial session loading. */
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
