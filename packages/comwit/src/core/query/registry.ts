import type { QueryBindingRegistry } from './types'
import { createLocalRegistryState, type LocalDefaults } from '../local'

/**
 * Default time (ms) a cache entry survives after the owning model loses
 * its last observer. Mirrors TanStack Query v5's `gcTime` default.
 */
export const DEFAULT_GC_TIME = 5 * 60 * 1000

export function createQueryBindingRegistry(localDefaults?: LocalDefaults): QueryBindingRegistry {
  return {
    boundResourceValue: new WeakMap(),
    boundPathProxy: new WeakMap(),
    boundResourceRuntime: new WeakMap(),
    selectorLoads: new WeakMap(),
    suspense: new Map(),
    runtimesByModel: new Map(),
    local: createLocalRegistryState(localDefaults),
  }
}
