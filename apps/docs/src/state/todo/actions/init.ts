import { action, silent } from '@meursyphus/yoshi'
import type { TodoActions } from '../types'
import { todoModel } from '../model'

export const todoInitActions = action<Pick<TodoActions, 'init'>>(({ inject }) => {
    const model = inject(todoModel)

    return {
        init(todos) {
            silent(() => {
                model.todos = todos
            })
        },
    }
})
