let silentDepth = 0

type Synchronous<T extends () => unknown> =
  Extract<ReturnType<T>, PromiseLike<unknown>> extends never ? T : never

/**
 * Suppress subscriber notifications within a synchronous callback scope.
 * Nested calls keep the outer scope active until it completes.
 *
 * @deprecated `silent()` cannot suppress React external-store snapshot checks
 * and is unsafe for render-time initialization. Prefer a generated domain
 * hook's `hydrate()` initializer for resolved server query values, or ordinary
 * actions after commit.
 */
export function silent<T extends () => unknown>(fn: Synchronous<T>): void {
  silentDepth++
  try {
    const callback = fn as T
    callback()
  } finally {
    silentDepth--
  }
}

export function isSilent() {
  return silentDepth > 0
}
