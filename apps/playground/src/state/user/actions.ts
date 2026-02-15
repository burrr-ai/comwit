import { action } from 'muchajs'
import type { UserActions } from './types'
import { userModel } from './model'

export const userActions = action<UserActions>(({ inject }) => {
    const model = inject(userModel)

    return {
        async bootstrap() {
            await Promise.all([
                model.me.load(),
                model.collaborators.load({ page: 1 }),
            ])
        },
        async loadFirstCollaborators() {
            await model.collaborators.load({ page: 1 })
        },
        async loadNextCollaborators() {
            const nextPage = Math.min(model.collaborators.page + 1, model.collaborators.totalPage)
            await model.collaborators.load({ page: nextPage })
        },
        async refreshMe() {
            await model.me.load()
        },
        async reloadUser() {
            await model.me.load()
        },
    }
})
