/**
 * Identity function declaring an API action implementation.
 * The build loader recognizes it to emit client/server indexes; at runtime it
 * returns the original async handler unchanged.
 */
export function createAction<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
): (...args: A) => Promise<T> {
  return fn
}

// oxlint-disable-next-line typescript/no-explicit-any
type ActionFn = (...args: any[]) => Promise<unknown>

/**
 * Identity marker for the API index's public object. During Next builds, the index
 * loader replaces this call and all action imports with an environment-specific ID facade.
 */
export function resolveActions<T extends Record<string, ActionFn>>(
  actions: T,
): T {
  return actions
}
