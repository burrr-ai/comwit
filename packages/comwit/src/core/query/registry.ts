import type { QueryBindingRegistry } from './types'

export function createQueryBindingRegistry(): QueryBindingRegistry {
  return {
    boundResourceValue: new WeakMap(),
    boundPathProxy: new WeakMap(),
    boundResourceRuntime: new WeakMap(),
    suspense: new Map(),
  }
}
