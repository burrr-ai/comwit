import * as React from 'react'
import type { QueryBindingRegistry, ResourceDescriptorMap } from './types'

type TrackedThenable = Promise<unknown> & { status?: string; value?: unknown }

const reactUse = (React as { use?: <T>(thenable: PromiseLike<T>) => T }).use

/**
 * Stand-in for a suspend key that already has its data. It keeps the `use()` slot of that key
 * occupied so later keys stay at the same slot on every replay. Pre-marked as fulfilled so
 * React returns at once without attaching listeners.
 */
export const SETTLED: Promise<unknown> = Object.assign(Promise.resolve(undefined), {
  status: 'fulfilled',
  value: undefined,
}) as TrackedThenable

/**
 * Suspend the current render on the given thenables, one per suspend key in selector order.
 *
 * On React 19 each goes through `use()`. `use()` remembers thenables by their call position
 * within a render and, on replay, keeps the earlier thenable of a position whatever the new
 * argument is ("components are idempotent"). Passing every key - settled ones as `SETTLED` -
 * keeps those positions stable, so a key that is still pending after the first one resolves is
 * tracked at its own slot instead of being mistaken for the first.
 *
 * A thrown promise is only pinged when it settles: if a boundary is already showing its fallback
 * and a sibling boundary suspends from a state update inside an effect, React 19 keeps
 * re-rendering the first boundary forever (tests/query-suspend-shared-key.test.tsx). `use()`
 * tracks the thenable's status and waits instead. React 18 has no `use()`, so the first pending
 * promise is thrown the classic way there.
 */
export function suspendOn(thenables: Promise<unknown>[]): void {
  if (typeof reactUse === 'function') {
    for (const thenable of thenables) reactUse(thenable)
    return
  }
  const pending = thenables.find((thenable) => thenable !== SETTLED)
  if (pending) throw pending
}

/**
 * Check suspense state for a model's resources and throw if needed.
 * Call this during React render (after useSyncExternalStore) to trigger Suspense/ErrorBoundary.
 */
export function checkSuspense(
  resourceDescriptors: ResourceDescriptorMap,
  registry: QueryBindingRegistry
): void {
  // Backward compatibility for the deprecated descriptor-level
  // `suspense: true` behavior.
  for (const [path, descriptor] of resourceDescriptors) {
    if (!descriptor.suspense) continue

    const entry = registry.suspense.get(path)
    if (!entry) continue

    // If there's an error, throw it for ErrorBoundary
    // Keep the entry so React's retry renders also throw
    if (entry.error) {
      throw entry.error
    }

    // If there's a pending promise, throw it for Suspense
    if (entry.promise) {
      throw entry.promise
    }
  }
}
