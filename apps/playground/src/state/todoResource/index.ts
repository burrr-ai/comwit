import { create } from 'muchajs'
import type { TodoResourceState, TodoResourceActions } from './types'
import { todoResourceModel } from './model'
import { todoResourceActions } from './actions'

export const useTodoResource = create<TodoResourceState, TodoResourceActions>(todoResourceModel, {
    actions: [todoResourceActions],
})

export type { DemoTodo, TodoResourceState, TodoResourceActions } from './types'
