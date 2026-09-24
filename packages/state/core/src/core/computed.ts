import type { FieldPlugin, PluginBag } from './plugin'

const COMPUTED_BRAND = Symbol('comwit-computed')

export type ComputedDescriptor<T = unknown> = {
  [COMPUTED_BRAND]: true
  selector: (state: any) => T
}

export function computed<T>(selector: (state: any) => T): T {
  return {
    [COMPUTED_BRAND]: true,
    selector,
  } as unknown as T
}

export function isComputedDescriptor(value: unknown): value is ComputedDescriptor {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [COMPUTED_BRAND]?: unknown })[COMPUTED_BRAND] === true
  )
}

export const COMPUTED_PLUGIN_NAME = 'computed'

export const computedPlugin: FieldPlugin = {
  name: COMPUTED_PLUGIN_NAME,

  detect(value: unknown, path: string, bag: PluginBag) {
    if (!isComputedDescriptor(value)) return null
    if (!path) throw new Error('computed() entry must be assigned to a model field')
    bag.set(path, value)
    return { initialValue: undefined }
  },

  createRegistryState(): null {
    return null
  },

  bindState(proxy: object, bag: PluginBag): object {
    if (bag.size === 0) return proxy
    return createComputedProxy(proxy, bag)
  },
}

export function createComputedProxy(proxy: object, bag: PluginBag): object {
  const computedKeys = new Set<string>()
  const selectors = new Map<string, (state: any) => unknown>()

  for (const [path, value] of bag) {
    computedKeys.add(path)
    selectors.set(path, (value as ComputedDescriptor).selector)
  }

  const computedProxy = new Proxy(proxy, {
    get(target, prop, receiver) {
      if (typeof prop === 'string' && computedKeys.has(prop)) {
        // Pass the computedProxy so selectors can read other computed fields
        return selectors.get(prop)!(computedProxy)
      }
      return Reflect.get(target, prop, receiver)
    },
    set(target, prop, value, receiver) {
      if (typeof prop === 'string' && computedKeys.has(prop)) {
        throw new Error(`Cannot set computed field "${prop}"`)
      }
      return Reflect.set(target, prop, value, receiver)
    },
  })

  return computedProxy
}

export function getComputedSnapshot(
  baseSnapshot: Record<string, unknown>,
  computedProxy: object,
  bag: PluginBag
): void {
  for (const [path, value] of bag) {
    const selector = (value as ComputedDescriptor).selector
    baseSnapshot[path] = selector(computedProxy)
  }
}
