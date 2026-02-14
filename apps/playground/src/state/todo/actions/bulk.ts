import { action } from '@meursyphus/yoshi'
import type { TodoActions } from '../types'
import { todoModel } from '../model'

export const todoBulkActions = action<Pick<TodoActions, 'clearCompleted' | 'setFilter'>>(({ inject }) => {
    const model = inject(todoModel)

    return {
        clearCompleted() {
            model.todos = model.todos.filter(t => t.status !== 'done')
        },
        setFilter(filter) {
            Object.assign(model.filter, filter)
        },
    }
})
