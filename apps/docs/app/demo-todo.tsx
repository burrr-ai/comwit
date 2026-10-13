'use client'

import { Copy } from '@/i18n/copy'
import { useTranslations } from 'next-intl'

import { Button } from '@comwit/ui-templates/button'
import { Input } from '@comwit/ui-templates/input'
import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'

type Todo = {
  id: string
  text: string
  done: boolean
}

const INITIAL_TODOS: Todo[] = [
  { id: '1', text: 'Install comwit', done: true },
  { id: '2', text: 'Define your first domain', done: false },
  { id: '3', text: 'Ship it', done: false },
]

let nextId = 4

export function DemoTodo() {
  const copy = useTranslations('Copy')

  const [todos, setTodos] = useState<Todo[]>(INITIAL_TODOS)
  const [input, setInput] = useState('')

  const add = useCallback(() => {
    const text = input.trim()
    if (!text) return
    setTodos((prev) => [...prev, { id: String(nextId++), text, done: false }])
    setInput('')
  }, [input])

  const toggle = useCallback((id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }, [])

  const remove = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <div className="w-full max-w-sm">
      <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted">
        <Copy id="text000" />
      </p>
      <div className="rounded-lg border border-border bg-white overflow-hidden">
        {/* Input */}
        <div className="flex border-b border-border">
          <Input
            bare
            type="text"
            aria-label={copy('text001')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder={copy('text002')}
            className="flex-1 bg-transparent px-4 py-2.5 text-[13px] text-foreground/80 placeholder:text-foreground/25 outline-none"
          />
          <Button
            variant="plain"
            size="none"
            onClick={add}
            aria-label={copy('text003')}
            className="px-3 text-muted transition-colors hover:text-foreground"
          >
            <svg
              className="size-3.5"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Button>
        </div>

        {/* List */}
        <ul className="divide-y divide-border/50">
          <AnimatePresence initial={false}>
            {todos.map((todo) => (
              <motion.li
                key={todo.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 px-4 py-2 group"
              >
                <Button
                  variant="plain"
                  size="none"
                  onClick={() => toggle(todo.id)}
                  aria-label={copy('markTodo', {
                    name: todo.text,
                    state: copy(todo.done ? 'incomplete' : 'complete'),
                  })}
                  aria-pressed={todo.done}
                  className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
                    todo.done
                      ? 'border-foreground bg-foreground/10'
                      : 'border-border hover:border-foreground/40'
                  }`}
                >
                  {todo.done && (
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-2 text-foreground"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </Button>
                <span
                  className={`flex-1 text-[13px] transition-colors ${
                    todo.done ? 'text-foreground/30 line-through' : 'text-foreground/70'
                  }`}
                >
                  <Copy text={todo.text} />
                </span>
                <Button
                  variant="plain"
                  size="none"
                  onClick={() => remove(todo.id)}
                  aria-label={copy('removeTodo', { name: todo.text })}
                  className="text-foreground/0 group-hover:text-foreground/30 hover:!text-foreground/60 transition-colors"
                >
                  <svg
                    className="size-3"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </Button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {/* Footer count */}
        {todos.length > 0 && (
          <div className="border-t border-border/50 px-4 py-1.5">
            <span className="text-[11px] text-foreground/25">
              {todos.filter((t) => !t.done).length} <Copy id="text004" />{' '}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
