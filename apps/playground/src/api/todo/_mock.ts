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

const INITIAL_TODOS: Todo[] = [
    {
        id: `seed_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
        title: 'Design API spec',
        status: 'done',
        priority: 'high',
        createdAt: Date.now() - 86400000,
    },
    {
        id: `seed_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
        title: 'Implement core proxy',
        status: 'in_progress',
        priority: 'high',
        createdAt: Date.now() - 43200000,
    },
    {
        id: `seed_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
        title: 'Write unit tests',
        status: 'pending',
        priority: 'medium',
        createdAt: Date.now() - 3600000,
    },
    {
        id: `seed_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
        title: 'Update README',
        status: 'pending',
        priority: 'low',
        createdAt: Date.now(),
    },
]

let todos: Todo[] = [...INITIAL_TODOS]

function generateTodoId() {
    return `todo_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function clone<T>(value: T): T {
    return structuredClone(value)
}

function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function randomDelay() {
    return wait(200 + Math.random() * 350)
}

function generateUniqueTodoId() {
    let id = generateTodoId()
    while (todos.some(todo => todo.id === id)) {
        id = generateTodoId()
    }
    return id
}

function maybeFail(action: string, options?: ActionOptions) {
    if (options?.forceFail) {
        throw new Error(`[mock server error] ${action}`)
    }
}

function dedupeTodos(source: Todo[]) {
    const seen = new Set<string>()

    return source.filter((todo) => {
        if (!todo?.id || seen.has(todo.id)) {
            return false
        }
        seen.add(todo.id)
        return true
    })
}

export async function findAll(): Promise<Todo[]> {
    await randomDelay()
    return clone(dedupeTodos(todos))
}

export async function getTodos(): Promise<Todo[]> {
    return findAll()
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
    await randomDelay()
    maybeFail('createTodo', input)

    const created: Todo = {
        id: generateUniqueTodoId(),
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

    const idx = todos.findIndex(todo => todo.id === id)
    if (idx === -1) {
        const fallback: Todo = {
            id,
            title: `Todo ${id}`,
            status: input.status ?? 'pending',
            priority: input.priority ?? 'low',
            createdAt: Date.now(),
        }
        if (!todos.some(todo => todo.id === id)) {
            todos = [fallback, ...todos]
        }
        return clone(fallback)
    }

    const next = { ...todos[idx], ...input }
    todos[idx] = next

    return clone(next)
}

export async function deleteTodo(id: string, options?: ActionOptions): Promise<{ id: string }> {
    await randomDelay()
    maybeFail('deleteTodo', options)

    if (!id) {
        throw new Error('Todo id is required')
    }

    const nextTodos = todos.filter(todo => todo.id !== id)
    if (nextTodos.length === todos.length) {
        return { id }
    }
    todos = nextTodos
    return { id }
}

export async function clearCompletedTodos(options?: ActionOptions): Promise<Todo[]> {
    await randomDelay()
    maybeFail('clearCompletedTodos', options)

    todos = todos.filter(todo => todo.status !== 'done')
    return clone(todos)
}
