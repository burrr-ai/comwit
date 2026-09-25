import { Suspense } from 'react'
import { connection } from 'next/server'
import { TodoPage } from '../page/todo'
import { findAll } from '@/api/todo/index'

export default function Home() {
  return (
    <Suspense fallback={<p style={{ padding: 24 }}>Loading todos…</p>}>
      <Todos />
    </Suspense>
  )
}

// With cacheComponents, uncached server data loads inside a Suspense boundary at request time.
// The mock API uses random delays, so mark the render dynamic before calling it.
async function Todos() {
  await connection()
  const todos = await findAll()
  return <TodoPage initialTodos={todos} />
}
