import { action } from 'muchajs'
import type { UserActions } from './types'
import { userModel } from './model'

export const userActions = action<UserActions>(({ inject }) => {
    const model = inject(userModel)

    return {
        async bootstrap() {
            await Promise.all([
                model.me.query(),
                model.collaborators.query({ page: 1 }),
            ])
        },
        async loadFirstCollaborators() {
            await model.collaborators.query({ page: 1 })
        },
        async loadNextCollaborators() {
            const nextPage = Math.min(model.collaborators.data.page + 1, model.collaborators.data.totalPage)
            await model.collaborators.query({ page: nextPage })
        },
        async refreshMe() {
            await model.me.query()
        },
        async reloadUser() {
            await model.me.query()
        },
    }
})
