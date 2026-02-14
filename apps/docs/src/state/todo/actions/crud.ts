import { action } from '@meursyphus/yoshi'
import type { TodoActions } from '../types'
import { todoModel } from '../model'

export const todoCrudActions = action<Pick<TodoActions, 'create' | 'delete' | 'updateStatus' | 'updatePriority'>>(({ inject }) => {
    const model = inject(todoModel)

    return {
        create(title, priority) {
            model.todos.push({
                id: crypto.randomUUID(),
                title,
                status: 'pending',
                priority,
                createdAt: Date.now(),
            })
        },
        updateStatus(id, status) {
            const todo = model.todos.find(t => t.id === id)
            if (todo) todo.status = status
        },
        updatePriority(id, priority) {
            const todo = model.todos.find(t => t.id === id)
            if (todo) todo.priority = priority
        },
        delete(id) {
            const idx = model.todos.findIndex(t => t.id === id)
            if (idx !== -1) model.todos.splice(idx, 1)
        },
    }
})
