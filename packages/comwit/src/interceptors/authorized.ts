import { AnyFunction, isThenable, intercept } from './utils'

type AuthorizedOptions = {
  when: () => boolean | Promise<boolean>
  onDeny: () => void | Promise<void>
}

/**
 * Higher-order function that wraps a function with an authorization guard.
 * Before executing the wrapped function, evaluates the `when` predicate. If
 * the predicate returns `true`, the function proceeds normally. If `false`,
 * the `onDeny` callback is invoked instead and the function returns `undefined`.
 * Both `when` and `onDeny` may be synchronous or asynchronous.
 *
 * @param options - Authorization configuration.
 * @param options.when - Predicate that determines whether execution is allowed.
 * @param options.onDeny - Called when the predicate returns `false`.
 * @returns A function wrapper that guards execution with authorization.
 *
 * @example
 * ```ts
 * import { onAuthorized } from 'comwit'
 *
 * const withAuth = onAuthorized({
 *   when: () => !!sessionStorage.getItem('token'),
 *   onDeny: () => router.push('/login'),
 * })
 * const guardedFetch = withAuth(fetchUserProfile)
 * ```
 */
export function onAuthorized<T extends AnyFunction>(options: AuthorizedOptions): (next: T) => T {
  return ((next: T) =>
    function (this: unknown, ...args: Parameters<T>) {
      const denied = () => {
        if (!options.onDeny) {
          return undefined
        }

        const result = options.onDeny()
        return isThenable(result) ? result.then(() => undefined) : undefined
      }

      const decided = options.when()

      if (isThenable(decided)) {
        return Promise.resolve(decided).then((ok) => {
          if (ok) {
            return (next as AnyFunction).apply(this, args)
          }

          return denied()
        }) as Awaited<ReturnType<T>>
      }

      if (!decided) {
        return denied() as any
      }

      return (next as AnyFunction).apply(this, args)
    } as T) as any
}

/**
 * Method decorator that guards the decorated method with an authorization check.
 * Before the method executes, evaluates the `when` predicate. If it returns
 * `true`, the method proceeds normally. If `false`, the `onDeny` callback is
 * invoked and the method returns `undefined`. Both `when` and `onDeny` may be
 * synchronous or asynchronous.
 *
 * @param options - Authorization configuration.
 * @param options.when - Predicate that determines whether execution is allowed.
 * @param options.onDeny - Called when the predicate returns `false`.
 * @returns A method decorator.
 *
 * @example
 * ```ts
 * class Api {
 *   @Authorized({
 *     when: () => !!sessionStorage.getItem('token'),
 *     onDeny: () => router.push('/login'),
 *   })
 *   async fetchProfile() {
 *     const res = await fetch('/api/profile')
 *     return res.json()
 *   }
 * }
 * ```
 */
export function Authorized(options: AuthorizedOptions): MethodDecorator {
  return intercept({
    intercept: (execute, args) => {
      const denied = () => {
        if (!options.onDeny) {
          return undefined
        }

        const result = options.onDeny()
        return isThenable(result) ? result.then(() => undefined) : undefined
      }

      const decided = options.when()

      if (isThenable(decided)) {
        return Promise.resolve(decided).then((ok) => {
          if (ok) {
            return execute(...args)
          }

          return denied()
        })
      }

      if (!decided) {
        return denied()
      }

      return execute(...args)
    },
  }) as MethodDecorator
}
