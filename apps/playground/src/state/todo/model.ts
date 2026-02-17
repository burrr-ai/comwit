import { model } from 'comwit'
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
