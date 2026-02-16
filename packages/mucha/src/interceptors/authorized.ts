import { AnyFunction, createDecorator, isThenable } from './utils'

type AuthorizedOptions = {
  when: () => boolean | Promise<boolean>
  onDeny: () => void | Promise<void>
}

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

export function Authorized(options: AuthorizedOptions): MethodDecorator {
  return createDecorator(onAuthorized(options))
}
