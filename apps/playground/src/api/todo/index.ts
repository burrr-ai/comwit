'use server'

import type { Todo } from '@/state/todo/types'

import {
    createTodo as mockCreateTodo,
    findAll as mockFindAll,
    clearCompletedTodos as mockClearCompletedTodos,
    deleteTodo as mockDeleteTodo,
    getTodos as mockGetTodos,
    updateTodo as mockUpdateTodo,
} from './_mock'

type CreateTodoInput = {
    title: string
    priority: Todo['priority']
    forceFail?: boolean
}

type UpdateTodoInput = {
    status?: Todo['status']
    priority?: Todo['priority']
    forceFail?: boolean
}

type ActionOptions = {
    forceFail?: boolean
}

export async function findAll(): Promise<Todo[]> {
    return mockFindAll()
}

export async function getTodos(): Promise<Todo[]> {
    return mockGetTodos()
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
    return mockCreateTodo(input)
}

export async function updateTodo(id: string, input: UpdateTodoInput): Promise<Todo> {
    return mockUpdateTodo(id, input)
}

export async function deleteTodo(id: string, options?: ActionOptions): Promise<{ id: string }> {
    return mockDeleteTodo(id, options)
}

export async function clearCompletedTodos(options?: ActionOptions): Promise<Todo[]> {
    return mockClearCompletedTodos(options)
}
