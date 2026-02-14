'use client'

import { useState } from 'react'
import { useTodo } from '@/state/todo'
import type { Todo } from '@/state/todo'

const STATUS_OPTIONS = ['pending', 'in_progress', 'done'] as const
const PRIORITY_OPTIONS = ['low', 'medium', 'high'] as const

function Stats() {
    const { todos } = useTodo(s => ({ todos: s.todos }))

    const total = todos.length
    const pending = todos.filter(t => t.status === 'pending').length
    const inProgress = todos.filter(t => t.status === 'in_progress').length
    const done = todos.filter(t => t.status === 'done').length

    return (
        <div style={{ display: 'flex', gap: 24, padding: '12px 0', borderBottom: '1px solid #ddd' }}>
            <span>Total: {total}</span>
            <span>Pending: {pending}</span>
            <span>In Progress: {inProgress}</span>
            <span>Done: {done}</span>
        </div>
    )
}

function FilterBar({ forceFail }: { forceFail: boolean }) {
    const { filter, actions } = useTodo(s => ({ filter: s.filter, actions: s.actions }))

    return (
        <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #ddd', flexWrap: 'wrap' }}>
            <input
                type="text"
                placeholder="Search..."
                value={filter.search}
                onChange={e => actions.setFilter({ search: e.target.value })}
                style={{ padding: '4px 8px', border: '1px solid #999', background: '#fff', color: '#000' }}
            />
            <select
                value={filter.status}
                onChange={e => actions.setFilter({ status: e.target.value as any })}
                style={{ padding: '4px 8px', border: '1px solid #999', background: '#fff', color: '#000' }}
            >
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
                value={filter.priority}
                onChange={e => actions.setFilter({ priority: e.target.value as any })}
                style={{ padding: '4px 8px', border: '1px solid #999', background: '#fff', color: '#000' }}
            >
                <option value="all">All Priority</option>
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button
                onClick={async () => {
                    try {
                        await actions.clearCompleted({ forceFail })
                    } catch {
                        // toast / retry behavior is handled by interceptors
                    }
                }}
                style={{ padding: '4px 12px', border: '1px solid #999', background: '#fff', color: '#000', cursor: 'pointer' }}
            >
                Clear Completed
            </button>
        </div>
    )
}

function AddTodo({ forceFail }: { forceFail: boolean }) {
    const [title, setTitle] = useState('')
    const [priority, setPriority] = useState<Todo['priority']>('medium')
    const { actions } = useTodo(s => ({ actions: s.actions }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return
        try {
            await actions.create(title.trim(), priority, { forceFail })
            setTitle('')
        } catch {
            // toast / error handling is done by interceptors
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, padding: '12px 0' }}>
            <input
                type="text"
                placeholder="New todo..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ flex: 1, padding: '4px 8px', border: '1px solid #999', background: '#fff', color: '#000' }}
            />
            <select
                value={priority}
                onChange={e => setPriority(e.target.value as Todo['priority'])}
                style={{ padding: '4px 8px', border: '1px solid #999', background: '#fff', color: '#000' }}
            >
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button
                type="submit"
                style={{ padding: '4px 12px', border: '1px solid #000', background: '#000', color: '#fff', cursor: 'pointer' }}
            >
                Add
            </button>
        </form>
    )
}

function TodoItem({ todo, forceFail }: { todo: Todo; forceFail: boolean }) {
    const { actions } = useTodo(s => ({ actions: s.actions }))

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 0',
            borderBottom: '1px solid #eee',
            opacity: todo.status === 'done' ? 0.5 : 1,
        }}>
            <span style={{ flex: 1, textDecoration: todo.status === 'done' ? 'line-through' : 'none' }}>
                {todo.title}
            </span>
            <span style={{ fontSize: 12, color: '#666' }}>
                {todo.priority}
            </span>
            <select
                value={todo.status}
                onChange={async e => {
                    try {
                        await actions.updateStatus(todo.id, e.target.value as Todo['status'], { forceFail })
                    } catch {
                        // toast / error handling is done by interceptors
                    }
                }}
                style={{ padding: '2px 4px', border: '1px solid #999', fontSize: 12, background: '#fff', color: '#000' }}
            >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
                onClick={async () => {
                    try {
                        await actions.delete(todo.id, { forceFail })
                    } catch {
                        // toast / error handling is done by interceptors
                    }
                }}
                style={{ padding: '2px 8px', border: '1px solid #999', background: '#fff', color: '#000', cursor: 'pointer', fontSize: 12 }}
            >
                x
            </button>
        </div>
    )
}

function TodoList({ forceFail }: { forceFail: boolean }) {
    const { todos, filter } = useTodo(s => ({ todos: s.todos, filter: s.filter }))

    const filtered = todos.filter(t => {
        if (filter.status !== 'all' && t.status !== filter.status) return false
        if (filter.priority !== 'all' && t.priority !== filter.priority) return false
        if (filter.search && !t.title.toLowerCase().includes(filter.search.toLowerCase())) return false
        return true
    })

    if (filtered.length === 0) {
        return <p style={{ padding: '24px 0', color: '#999', textAlign: 'center' }}>No todos</p>
    }

    return (
        <div>
            {filtered.map(todo => <TodoItem key={todo.id} todo={todo} forceFail={forceFail} />)}
        </div>
    )
}

export function TodoPage({ initialTodos }: { initialTodos: Todo[] }) {
    const { actions } = useTodo(s => ({ actions: s.actions }))
    const [forceFail, setForceFail] = useState(false)
    actions.init(initialTodos)

    return (
        <main style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px', fontFamily: 'var(--font-geist-mono)' }}>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Yoshi Todo</h1>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <input
                    type="checkbox"
                    checked={forceFail}
                    onChange={e => setForceFail(e.target.checked)}
                />
                실패 강제 재현 토글
            </label>
            <Stats />
            <FilterBar forceFail={forceFail} />
            <AddTodo forceFail={forceFail} />
            <TodoList forceFail={forceFail} />
        </main>
    )
}
