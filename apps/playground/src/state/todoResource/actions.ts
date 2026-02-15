import { action, silent } from 'muchajs'
import type { TodoResourceActions } from './types'
import { todoResourceModel } from './model'

export const todoResourceActions = action<TodoResourceActions>(({ inject }) => {
    const model = inject(todoResourceModel)

    return {
        async loadFirst() {
            await model.todos.load({ page: 1 })
        },
        async loadNext() {
            await model.todos.load({ page: model.todos.page + 1 })
        },
        seed() {
            silent(() => {
                model.todos.set({
                    data: [
                        {
                            id: 'seed-1',
                            title: 'Seeded todo',
                            done: false,
                        },
                    ],
                    page: 1,
                })
            })
        },
    }
})
