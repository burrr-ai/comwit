import { intercept } from './utils'

export class ValidationError extends Error {
  constructor(public errors: Record<string, string>) {
    super(`Validation failed: ${Object.values(errors).join(', ')}`)
    this.name = 'ValidationError'
  }
}

type ValidatorFn = (value: any) => true | string
type ValidatorMap = Record<string, ValidatorFn>

/**
 * Validates action method arguments before execution.
 *
 * Each key in the validators map corresponds to an argument by position
 * (first key → first arg, second key → second arg, etc.).
 * If any validator returns a string (error message), a `ValidationError` is thrown.
 *
 * @example
 * ```ts
 * class TodoActions {
 *   @Validate({
 *     title: (v) => (typeof v === 'string' && v.length > 0) || 'Title required',
 *     priority: (v) => [1, 2, 3].includes(v) || 'Priority must be 1-3',
 *   })
 *   createTodo(title: string, priority: number) { ... }
 * }
 * ```
 */
export function Validate(validators: ValidatorMap) {
  return intercept({
    intercept(execute, args) {
      const keys = Object.keys(validators)
      const errors: Record<string, string> = {}

      keys.forEach((key, index) => {
        const result = validators[key](args[index])
        if (result !== true) {
          errors[key] = typeof result === 'string' ? result : `Invalid ${key}`
        }
      })

      if (Object.keys(errors).length > 0) {
        throw new ValidationError(errors)
      }

      return execute(...args)
    },
  })
}

// Functional alias
export const validate = Validate
