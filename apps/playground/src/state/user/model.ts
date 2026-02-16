import { model, query } from 'muchajs'
import type { DemoUser, UserState } from './types'
import { getCollaborators, getCurrentUser } from '@/api/user'

export const userModel = model<UserState>({
  me: query<DemoUser>({
    initialData: {
      id: '',
      username: '',
      displayName: '',
      email: '',
      organization: '',
      role: 'member',
      joinedAt: '',
    },
    queryFn: async () => {
      const data = await getCurrentUser()
      return data
    },
  }),
  collaborators: query<
    {
      data: DemoUser[]
      page: number
      totalPage: number
      totalCount: number
    },
    { page?: number }
  >({
    initialData: {
      data: [] as DemoUser[],
      page: 1,
      totalPage: 1,
      totalCount: 0,
    },
    queryFn: ({ page = 1 }) => {
      return getCollaborators({ page, pageSize: 4 })
    },
  }),
})
