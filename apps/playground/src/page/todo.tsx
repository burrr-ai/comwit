'use client'

import { useEffect, useRef, useState } from 'react'
import { useTodo } from '@/state/todo'
import { useUser } from '@/state/user'
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
        } catch (e) {
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

function ResourceSection() {
    const { me, collaborators, actions } = useUser(s => ({
        me: s.me,
        collaborators: s.collaborators,
        actions: s.actions,
    }))

    useEffect(() => {
        void actions.reloadUser().catch(() => {})
        void actions.loadFirstCollaborators().catch(() => {})
    }, [actions])

    const profileName = me.data.displayName || '불러오는 중...'
    const profileEmail = me.data.email || 'loading@example.com'

    return (
        <section style={{
            marginTop: 14,
            padding: '10px 12px',
            border: '1px solid #edf0f3',
            borderRadius: 12,
            background: '#ffffff',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: me.isLoading ? '#d1d5db' : '#111827',
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 700,
                        fontSize: 13,
                    }}>
                        {me.isLoading ? '...' : (me.data.displayName || 'D').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                        <p style={{ margin: 0, fontWeight: 600, lineHeight: 1.2 }}>
                            {me.isLoading ? '프로필 불러오는 중...' : profileName}
                        </p>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>
                            {me.isLoading ? '...' : profileEmail}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => { if (!me.isLoading) { void actions.reloadUser() } }}
                    style={{
                        padding: '4px 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        background: '#fff',
                        color: '#111827',
                        fontSize: 11,
                        cursor: me.isLoading ? 'not-allowed' : 'pointer',
                    }}
                >
                    {me.isLoading ? '로딩 중' : '새로고침'}
                </button>
            </div>

            <div style={{ marginTop: 8, borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
                        Collaborators {collaborators.isLoading ? 'loading...' : `(${collaborators.totalCount ?? 0})`}
                    </p>
                    <button
                        disabled={collaborators.isLoading}
                        onClick={() => void actions.loadFirstCollaborators()}
                        style={{
                            opacity: collaborators.isLoading ? 0.6 : 1,
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            background: '#fff',
                            color: '#6b7280',
                            fontSize: 11,
                            padding: '2px 8px',
                            cursor: collaborators.isLoading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        팀원 갱신
                    </button>
                </div>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                    {collaborators.isLoading ? (
                        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>팀원을 불러오는 중...</p>
                    ) : collaborators.data.length === 0 ? (
                        <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>불러온 팀원이 없습니다.</p>
                    ) : (
                        collaborators.data.map(user => (
                            <span key={user.id} style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: '#111827',
                                color: '#fff',
                                display: 'inline-grid',
                                placeItems: 'center',
                                fontSize: 11,
                                fontWeight: 700,
                                flex: '0 0 auto',
                            }}>
                                {user.displayName.slice(0, 1)}
                            </span>
                        ))
                    )}
                </div>
                {collaborators.isError && (
                    <button
                        onClick={() => { void actions.loadFirstCollaborators() }}
                        style={{
                            marginTop: 6,
                            border: '1px solid #fecaca',
                            borderRadius: 6,
                            background: '#fff5f5',
                            color: '#b91c1c',
                            fontSize: 11,
                            padding: '2px 8px',
                        }}
                    >
                        팀원 다시 불러오기
                    </button>
                )}
            </div>

            {me.isError && <p style={{ margin: '6px 0 0', color: 'crimson', fontSize: 12 }}>user error: {String(me.error)}</p>}
        </section>
    )
}

export function TodoPage({ initialTodos }: { initialTodos: Todo[] }) {
    const { actions } = useTodo(s => ({ actions: s.actions }))
    const [forceFail, setForceFail] = useState(false)
    const hasInitRef = useRef(false)

    if (!hasInitRef.current) {
        hasInitRef.current = true
        actions.init(initialTodos)
    }

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
            <ResourceSection />
            <Stats />
            <FilterBar forceFail={forceFail} />
            <AddTodo forceFail={forceFail} />
            <TodoList forceFail={forceFail} />
        </main>
    )
}
