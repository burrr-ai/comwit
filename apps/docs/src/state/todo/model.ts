import { model } from '@meursyphus/yoshi'
import type { TodoState } from './types'

export const todoModel = model<TodoState>({
    todos: [],
    errorMessage: '',
})
