import type { Todo } from '@/state/todo'
import { TodoPage } from './todo-page'

async function fetchTodos(): Promise<Todo[]> {
    // Simulate server-side data fetching
    await new Promise(resolve => setTimeout(resolve, 100))

    return [
        { id: '1', title: 'Design API spec', status: 'done', priority: 'high', createdAt: Date.now() - 86400000 },
        { id: '2', title: 'Implement core proxy', status: 'in_progress', priority: 'high', createdAt: Date.now() - 43200000 },
        { id: '3', title: 'Write unit tests', status: 'pending', priority: 'medium', createdAt: Date.now() - 3600000 },
        { id: '4', title: 'Update README', status: 'pending', priority: 'low', createdAt: Date.now() },
    ]
}

export default async function Home() {
    const todos = await fetchTodos()

    return <TodoPage initialTodos={todos} />
}
