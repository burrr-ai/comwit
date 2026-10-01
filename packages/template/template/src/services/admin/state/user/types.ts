import type { Query } from '@comwit/state'

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

export type UserState = {
  me: Query<User | null>
  isLoading: boolean
}

export type UserActions = {
  signIn(args: { email: string; password: string }): Promise<void>
  changePassword(args: { currentPassword: string; newPassword: string }): Promise<void>
  signOut(): Promise<void>
}
