import { create } from '@comwit/state'
import type { UserActions, UserState } from './types'
import { userModel } from './model'
import { userActions } from './actions'

export const useUser = create<UserState, UserActions>(userModel, {
  actions: [userActions],
})

export type { DemoUser, UserActions, UserState } from './types'
