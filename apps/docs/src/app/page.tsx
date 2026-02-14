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

function FilterBar() {
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
                onClick={() => actions.clearCompleted()}
                style={{ padding: '4px 12px', border: '1px solid #999', background: '#fff', color: '#000', cursor: 'pointer' }}
            >
                Clear Completed
            </button>
        </div>
    )
}

function AddTodo() {
    const [title, setTitle] = useState('')
    const [priority, setPriority] = useState<Todo['priority']>('medium')
    const { actions } = useTodo(s => ({ actions: s.actions }))

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return
        actions.create(title.trim(), priority)
        setTitle('')
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

function TodoItem({ todo }: { todo: Todo }) {
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
                onChange={e => actions.updateStatus(todo.id, e.target.value as Todo['status'])}
                style={{ padding: '2px 4px', border: '1px solid #999', fontSize: 12, background: '#fff', color: '#000' }}
            >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
                onClick={() => actions.delete(todo.id)}
                style={{ padding: '2px 8px', border: '1px solid #999', background: '#fff', color: '#000', cursor: 'pointer', fontSize: 12 }}
            >
                x
            </button>
        </div>
    )
}

function TodoList() {
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
            {filtered.map(todo => <TodoItem key={todo.id} todo={todo} />)}
        </div>
    )
}

export default function Home() {
    return (
        <main style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px', fontFamily: 'var(--font-geist-mono)' }}>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Yoshi Todo</h1>
            <Stats />
            <FilterBar />
            <AddTodo />
            <TodoList />
        </main>
    )
}
