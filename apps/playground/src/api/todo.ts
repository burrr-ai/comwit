'use server'

import type { Todo } from '@/state/todo/types'

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

let todos: Todo[] = [
    { id: '1', title: 'Design API spec', status: 'done', priority: 'high', createdAt: Date.now() - 86400000 },
    { id: '2', title: 'Implement core proxy', status: 'in_progress', priority: 'high', createdAt: Date.now() - 43200000 },
    { id: '3', title: 'Write unit tests', status: 'pending', priority: 'medium', createdAt: Date.now() - 3600000 },
    { id: '4', title: 'Update README', status: 'pending', priority: 'low', createdAt: Date.now() },
]

let nextId = 5

function clone<T>(value: T): T {
    return structuredClone(value)
}

function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function randomDelay() {
    return wait(200 + Math.random() * 350)
}

function maybeFail(action: string, options?: ActionOptions) {
    if (options?.forceFail) {
        throw new Error(`[mock server error] ${action}`)
    }
}

export async function getTodos(): Promise<Todo[]> {
    await randomDelay()
    return clone(todos)
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
    await randomDelay()
    maybeFail('createTodo', input)

    const created: Todo = {
        id: String(nextId++),
        title: input.title.trim(),
        status: 'pending',
        priority: input.priority,
        createdAt: Date.now(),
    }
    todos = [created, ...todos]
    return clone(created)
}

export async function updateTodo(id: string, input: UpdateTodoInput): Promise<Todo> {
    await randomDelay()
    maybeFail('updateTodo', input)

    const idx = todos.findIndex(t => t.id === id)
    if (idx === -1) throw new Error(`Todo not found: ${id}`)

    const next = { ...todos[idx], ...input }
    todos[idx] = next
    return clone(next)
}

export async function deleteTodo(id: string, options?: ActionOptions): Promise<{ id: string }> {
    await randomDelay()
    maybeFail('deleteTodo', options)

    const next = todos.filter(t => t.id !== id)
    if (next.length === todos.length) throw new Error(`Todo not found: ${id}`)
    todos = next
    return { id }
}

export async function clearCompletedTodos(options?: ActionOptions): Promise<Todo[]> {
    await randomDelay()
    maybeFail('clearCompletedTodos', options)

    todos = todos.filter(t => t.status !== 'done')
    return clone(todos)
}
