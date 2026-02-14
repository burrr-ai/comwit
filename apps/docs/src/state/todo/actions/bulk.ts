import { action } from '@meursyphus/yoshi'
import type { TodoActions } from '../types'
import { todoModel } from '../model'

export const todoBulkActions = action<Pick<TodoActions, 'deleteMany'>>((inject) => {
    const model = inject(todoModel)

    return {
        async deleteMany(ids) {
            model.todos = model.todos.filter(t => !ids.includes(t.id))
        },
    }
})
