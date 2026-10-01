import { action } from '@comwit/state'
import type { User, UserActions } from '../types'
import { user } from '../model'

type UserAuthActions = Pick<
  UserActions,
  'signIn' | 'changePassword' | 'signOut'
>

export const userAuthActions = action<UserAuthActions>(({ state }) => {
  class UserAuthActions {
    private model = state(user)

    async signIn({ email, password }: { email: string; password: string }): Promise<void> {
      this.model.isLoading = true
      try {
        const nextUser: User = {
          id: '1',
          email,
          name: 'Admin User',
          username: email,
          displayUsername: email,
          image: null,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        this.model.me.set(nextUser)
      } finally {
        this.model.isLoading = false
      }
    }

    async changePassword({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string
      newPassword: string
    }): Promise<void> {
      this.model.isLoading = true
      try {
        if (!currentPassword) throw new Error('현재 비밀번호를 입력해주세요.')
        if (newPassword.length < 8) throw new Error('새 비밀번호는 8자 이상이어야 합니다.')
      } finally {
        this.model.isLoading = false
      }
    }

    async signOut(): Promise<void> {
      this.model.isLoading = true
      try {
        this.model.me.set(null)
      } finally {
        this.model.isLoading = false
      }
    }
  }

  return new UserAuthActions()
})
