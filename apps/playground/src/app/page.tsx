import { TodoPage } from '../page/todo'
import { getTodos } from '@/api/todo'

export default async function Home() {
    const todos = await getTodos()

    return <TodoPage initialTodos={todos} />
}
