import { create } from '@meursyphus/yoshi'
import type { TodoState, TodoActions } from './types'
import { todoModel } from './model'
import { todoCrudActions } from './actions/crud'
import { todoBulkActions } from './actions/bulk'

export const useTodo = create<TodoState, TodoActions>(todoModel, {
    actions: [todoCrudActions, todoBulkActions],
})

export type { Todo, Filter, TodoState, TodoActions } from './types'
