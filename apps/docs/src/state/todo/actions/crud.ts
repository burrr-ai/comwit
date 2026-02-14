import { action } from '@meursyphus/yoshi'
import type { TodoActions } from '../types'
import { todoModel } from '../model'

export const todoCrudActions = action<Pick<TodoActions, 'create' | 'delete'>>((inject) => {
    const model = inject(todoModel)

    return {
        async create(title) {
            // TODO: implement API call
            model.todos.push({ id: crypto.randomUUID(), title, status: 'pending' })
        },
        async delete(id) {
            model.todos = model.todos.filter(t => t.id !== id)
        },
    }
})
