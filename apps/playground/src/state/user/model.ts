import { model, resource } from 'muchajs'
import type { DemoUser, UserState } from './types'
import { getCollaborators, getCurrentUser } from '@/api/user'

export const userModel = model<UserState>({
    me: resource<DemoUser>({
        initialData: {
            id: '',
            username: '',
            displayName: '',
            email: '',
            organization: '',
            role: 'member',
            joinedAt: '',
        },
        load: async () => {
            const data = await getCurrentUser()
            return data
        },
    }),
    collaborators: resource.page<DemoUser[], { page?: number }>({
        initialData: [] as DemoUser[],
        load: ({ page = 1 }) => {
            return getCollaborators({ page, pageSize: 4 })
        },
    }),
})
