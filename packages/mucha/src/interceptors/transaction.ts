import { createDecorator, Interceptor } from './utils'

/**
 * Experimental placeholder.
 *
 * Current implementation does not provide write-safe rollback. It keeps the
 * public API (`@Transaction`, `transaction`) in place for planning, but the
 * behavior is intentionally not enabled until a scoped proxy snapshot strategy
 * is implemented.
 */

export function transaction(): <T extends (...args: any[]) => any>(next: T) => T {
  return (next) => {
    // TODO: Implement scoped rollback once proxy tracking strategy is finalized.
    return next
  }
}

export function Transaction(): MethodDecorator {
  return createDecorator(transaction())
}
