import { intercept, type StageMethodDecorator } from './utils'

/**
 * Higher-order function placeholder for transactional method execution.
 *
 * **Experimental:** The current implementation is a no-op passthrough. It
 * preserves the public API surface (`transaction`, `@Transaction`) for
 * planning purposes, but write-safe rollback behavior is intentionally not
 * enabled until a scoped proxy snapshot strategy is implemented.
 *
 * @returns A function wrapper that currently passes through without modification.
 *
 * @example
 * ```ts
 * import { transaction } from 'comwit'
 *
 * const withTransaction = transaction()
 * const safeSave = withTransaction(saveData)
 * ```
 */
export function transaction(): <T extends (...args: any[]) => any>(next: T) => T {
  return (next) => {
    // TODO: Implement scoped rollback once proxy tracking strategy is finalized.
    return next
  }
}

/**
 * Method decorator placeholder for transactional method execution.
 *
 * **Experimental:** The current implementation is a no-op. It preserves the
 * decorator API for planning purposes, but write-safe rollback behavior is
 * intentionally not enabled until a scoped proxy snapshot strategy is
 * implemented.
 *
 * @returns A method decorator (currently a no-op).
 *
 * @example
 * ```ts
 * class Store {
 *   @Transaction()
 *   async transferFunds(from: string, to: string, amount: number) {
 *     await this.debit(from, amount)
 *     await this.credit(to, amount)
 *   }
 * }
 * ```
 */
export function Transaction(): StageMethodDecorator {
  return intercept({}) as unknown as StageMethodDecorator
}
