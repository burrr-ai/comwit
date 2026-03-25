import type { AnyFunction, Interceptor } from './utils'

type MethodMap = Record<string, AnyFunction>
type InterceptorMap<T extends MethodMap> = {
  [K in keyof T]?: Interceptor<T[K]> | Interceptor<T[K]>[]
}

/**
 * Applies interceptors to methods of a plain object without using decorator
 * syntax. This is the recommended alternative for environments where decorator
 * syntax is not supported (e.g. SWC production builds in Next.js).
 *
 * Interceptors are applied left-to-right: the first interceptor in the array
 * wraps the original method (innermost), and each subsequent interceptor wraps
 * the previous result (outermost). This matches the bottom-to-top application
 * order of stacked decorators.
 *
 * @param methods - An object whose values are functions to be intercepted.
 * @param interceptorMap - A mapping of method names to interceptor(s).
 * @returns A new object with interceptors applied to the specified methods.
 *
 * @example
 * ```ts
 * import { action, onError, retry, withInterceptors } from 'comwit'
 *
 * export const todoActions = action(({ state }) => {
 *   const todos = state(todoModel)
 *
 *   return withInterceptors({
 *     async addTodo(title: string) {
 *       todos.items.push({ title, done: false })
 *       await fetch('/api/todos', { method: 'POST', body: title })
 *     },
 *     async deleteTodo(id: string) {
 *       await fetch(`/api/todos/${id}`, { method: 'DELETE' })
 *     },
 *   }, {
 *     addTodo: [onError((err) => console.error('Failed:', err)), retry(3)],
 *     deleteTodo: onError((err) => console.error('Delete failed:', err)),
 *   })
 * })
 * ```
 */
export function withInterceptors<T extends MethodMap>(
  methods: T,
  interceptorMap: InterceptorMap<T>
): T {
  const result = { ...methods }

  for (const key of Object.keys(interceptorMap) as (keyof T & string)[]) {
    if (!(key in methods)) continue
    const interceptors = interceptorMap[key]
    if (!interceptors) continue

    const list = Array.isArray(interceptors) ? interceptors : [interceptors]
    let fn = methods[key]
    for (const interceptor of list) {
      fn = interceptor(fn)
    }
    result[key] = fn
  }

  return result
}
