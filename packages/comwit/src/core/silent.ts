/**
 * Suppress state change notifications within a synchronous callback scope.
 * Nested calls keep the outer scope active until it completes.
 *
 * @example
 * ```ts
 * import { silent } from '@comwit/state'
 *
 * silent(() => {
 *   model.todos = serverData.todos
 * })
 * ```
 */
let silentDepth = 0

type Synchronous<T extends () => unknown> = ReturnType<T> extends PromiseLike<unknown> ? never : T

export function silent<T extends () => unknown>(fn: Synchronous<T>): ReturnType<T> {
  silentDepth++
  try {
    return (fn as T)() as ReturnType<T>
  } finally {
    silentDepth--
  }
}

export function isSilent() {
  return silentDepth > 0
}
