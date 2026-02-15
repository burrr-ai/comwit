"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";

type Todo = {
  id: string;
  text: string;
  done: boolean;
};

const INITIAL_TODOS: Todo[] = [
  { id: "1", text: "Install muchajs", done: true },
  { id: "2", text: "Define your first domain", done: false },
  { id: "3", text: "Ship it", done: false },
];

let nextId = 4;

export function DemoTodo() {
  const [todos, setTodos] = useState<Todo[]>(INITIAL_TODOS);
  const [input, setInput] = useState("");

  const add = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [...prev, { id: String(nextId++), text, done: false }]);
    setInput("");
  }, [input]);

  const toggle = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }, []);

  const remove = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="w-full max-w-sm">
      <p className="mb-3 font-serif text-[11px] uppercase tracking-[0.2em] text-gold-dark/50">
        Interactive Demo
      </p>
      <div className="rounded-lg border border-gold/30 bg-cream-light/60 backdrop-blur-sm overflow-hidden">
        {/* Input */}
        <div className="flex border-b border-gold/20">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add a todo..."
            className="flex-1 bg-transparent px-4 py-2.5 font-serif text-[13px] text-foreground/80 placeholder:text-foreground/25 outline-none"
          />
          <button
            onClick={add}
            className="px-3 text-gold-dark/60 transition-colors hover:text-gold-dark"
          >
            <svg
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
          </button>
        </div>

        {/* List */}
        <ul className="divide-y divide-gold/10">
          <AnimatePresence initial={false}>
            {todos.map((todo) => (
              <motion.li
                key={todo.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 px-4 py-2 group"
              >
                <button
                  onClick={() => toggle(todo.id)}
                  className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
                    todo.done
                      ? "border-gold bg-gold/20"
                      : "border-gold/40 hover:border-gold"
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
                      className="text-gold-dark"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span
                  className={`flex-1 font-serif text-[13px] transition-colors ${
                    todo.done
                      ? "text-foreground/30 line-through"
                      : "text-foreground/70"
                  }`}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => remove(todo.id)}
                  className="text-foreground/0 group-hover:text-foreground/30 hover:!text-foreground/60 transition-colors"
                >
                  <svg
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
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {/* Footer count */}
        {todos.length > 0 && (
          <div className="border-t border-gold/10 px-4 py-1.5">
            <span className="font-serif text-[11px] text-foreground/25">
              {todos.filter((t) => !t.done).length} remaining
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
