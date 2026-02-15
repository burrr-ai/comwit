'use client'

import { useTodoResource } from '@/state/todoResource'

export function ResourceDemoPage() {
    const { todos, actions } = useTodoResource(s => ({
        todos: s.todos,
        actions: s.actions,
    }))

    const isLast = todos.page >= todos.totalPage

    return (
        <main style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
            <h1 style={{ marginBottom: 12 }}>Resource Demo</h1>
            <p style={{ marginBottom: 12 }}>
                isLoading: {String(todos.isLoading)} / isFetching: {String(todos.isFetching)} /
                page {todos.page}/{todos.totalPage} / items {todos.data.length}
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={() => actions.loadFirst()}>Load first</button>
                <button onClick={() => actions.loadNext()} disabled={isLast}>Load next</button>
                <button onClick={() => actions.seed()}>Seed set()</button>
            </div>
            <ul style={{ paddingLeft: 18 }}>
                {todos.data.map(todo => (
                    <li key={todo.id}>{todo.title}</li>
                ))}
            </ul>
            {todos.isError && (
                <p style={{ color: 'crimson' }}>error: {String(todos.error)}</p>
            )}
        </main>
    )
}
