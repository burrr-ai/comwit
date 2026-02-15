import { TodoPage } from '../page/todo'
import { findAll } from '@/api/todo/index'

export default async function Home() {
    const todos = await findAll()

    return <TodoPage initialTodos={todos} />
}
