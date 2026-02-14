import { action } from '@meursyphus/yoshi'
import type { TodoActions } from '../types'
import { todoModel } from '../model'

export const todoBulkActions = action<Pick<TodoActions, 'deleteMany'>>((state) => {
    const model = state(todoModel)

    return {
        async deleteMany(ids) {
            model.todos = model.todos.filter(t => !ids.includes(t.id))
        },
    }
})
