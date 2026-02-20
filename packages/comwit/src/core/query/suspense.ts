import type { QueryBindingRegistry, ResourceDescriptorMap } from './types'

/**
 * Check suspense state for a model's resources and throw if needed.
 * Call this during React render (after useSyncExternalStore) to trigger Suspense/ErrorBoundary.
 */
export function checkSuspense(
  resourceDescriptors: ResourceDescriptorMap,
  registry: QueryBindingRegistry
): void {
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
