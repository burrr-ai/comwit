import { model } from 'mucha'
import type { TodoState } from './types'

export const todoModel = model<TodoState>({
    todos: [],
    filter: {
        status: 'all',
        priority: 'all',
        search: '',
    },
    errorMessage: '',
})
