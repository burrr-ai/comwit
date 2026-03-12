import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react'
import { createProxy, snapshot, subscribe } from './proxy'
import { getPlugins, type PluginBag } from './plugin'
import { useStoreRegistry } from './provider'
import { isEqual } from '../utils'
import { isSilent } from './silent'
import { COMPUTED_PLUGIN_NAME, createComputedProxy, getComputedSnapshot } from './computed'

export type StoreEntry<T extends object = any> = {
  proxy: T
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

export type ModelOptions<T extends object, D extends object = {}> = {
  derive?: (state: T) => { [K in keyof D]: () => D[K] }
  rules?: { [K in keyof T]?: (value: T[K]) => true | string }
}

export type ValidationState<T> = {
  errors: { [K in keyof T]?: string | null }
  isValid: boolean
}

export function model<T extends object>(initial: T): Model<T>
export function model<T extends object, D extends object>(
  initial: T,
  options: ModelOptions<T, D>
): Model<T & Readonly<D> & { $validation: ValidationState<T> }>
export function model<T extends object, D extends object = {}>(
  initial: T,
  options?: ModelOptions<T, D>
): Model<T & Readonly<D>> {
  const pluginBags = new Map<string, PluginBag>()
  const plugins = getPlugins()

  for (const plugin of plugins) {
    pluginBags.set(plugin.name, new Map())
  }

  const template = normalize(initial as Record<string, unknown>, '', pluginBags)
  const cloneState = () => structuredClone(template) as T

  const m: Model<T & Readonly<D>> = {
    key: Symbol(),
    pluginBags,
    instance(): StoreEntry<T & Readonly<D>> {
      const p = createProxy(cloneState())

      const deriveFactory = options?.derive
      const rules = options?.rules
      let derivedGetters: Record<string, () => unknown> | null = null
      let derivedKeys: Set<string> | null = null

      if (deriveFactory) {
        derivedGetters = deriveFactory(p as T) as Record<string, () => unknown>
        derivedKeys = new Set(Object.keys(derivedGetters))
      }

      const computedBag = pluginBags.get(COMPUTED_PLUGIN_NAME)
      const hasComputed = computedBag != null && computedBag.size > 0
      const hasExtensions = derivedGetters != null || rules != null || hasComputed

      let computedProxyRef: object | null = null
      let publicProxy: unknown = p
      if (hasComputed) {
        computedProxyRef = createComputedProxy(p as object, computedBag!)
        publicProxy = computedProxyRef
      }
      if (derivedGetters || rules) {
        const base = publicProxy as object
        publicProxy = new Proxy(base, {
          get(target, prop, receiver) {
            if (typeof prop === 'string' && derivedKeys?.has(prop)) {
              return derivedGetters![prop]()
            }
            if (prop === '$validation' && rules) {
              return computeValidation(p as Record<string, unknown>, rules)
            }
            return Reflect.get(target, prop, receiver)
          },
          set(target, prop, value, receiver) {
            if (typeof prop === 'string' && derivedKeys?.has(prop)) {
              throw new Error(`Cannot set derived field "${prop}"`)
            }
            if (prop === '$validation') {
              throw new Error('Cannot set $validation')
            }
            return Reflect.set(target, prop, value, receiver)
          },
        })
      }

      return {
        proxy: publicProxy as T & Readonly<D>,
        getSnapshot() {
          if (!hasExtensions) return snapshot(p) as T & Readonly<D>

          const base = snapshot(p)
          const result: Record<string, unknown> = { ...(base as object) }

          if (hasComputed) {
            getComputedSnapshot(result, computedProxyRef!, computedBag!)
          }

          if (derivedGetters) {
            for (const [key, getter] of Object.entries(derivedGetters)) {
              result[key] = getter()
            }
          }

          if (rules) {
            result.$validation = computeValidation(p as Record<string, unknown>, rules)
          }

          return Object.freeze(result) as T & Readonly<D>
        },
        subscribe(listener) {
          return subscribe(p, () => {
            if (!isSilent()) listener()
          })
        },
      }
    },
  }

  return m
}

function computeValidation<T extends object>(
  proxy: Record<string, unknown>,
  rules: { [K in keyof T]?: (value: T[K]) => true | string }
): ValidationState<T> {
  const errors: Record<string, string | null> = {}
  let isValid = true
  for (const [field, validator] of Object.entries(rules)) {
    if (!validator) continue
    const value = proxy[field]
    const result = (validator as (v: unknown) => true | string)(value)
    if (result === true) {
      errors[field] = null
    } else {
      errors[field] = typeof result === 'string' ? result : `Invalid ${field}`
      isValid = false
    }
  }
  return { errors, isValid } as ValidationState<T>
}

export type Model<T extends object> = {
  key: symbol
  pluginBags: Map<string, PluginBag>
  instance(): StoreEntry<T>
}

export function useModel<T extends object>(m: Model<T>): T
export function useModel<T extends object, R>(m: Model<T>, selector: (state: T) => R): R
export function useModel<T extends object, R>(m: Model<T>, selector?: (state: T) => R): T | R {
  if (process.env.NODE_ENV !== 'production' && !selector) {
    console.warn(
      '[comwit] useModel() without a selector subscribes to the entire state tree, ' +
        'which may cause unnecessary re-renders. Consider using a selector: ' +
        'useModel(model, s => s.field)'
    )
  }

  const registry = useStoreRegistry()
  const store = registry.get(m)

  const prevRef = useRef<unknown>(null)
  const selectorRef = useRef(selector)
  selectorRef.current = selector

  const subscribe = useCallback((listener: () => void) => store.subscribe(listener), [store])

  const getSnapshot = useCallback(() => {
    const raw = store.getSnapshot()
    const next = selectorRef.current ? selectorRef.current(raw) : raw

    if (prevRef.current !== null && isEqual(prevRef.current, next)) {
      return prevRef.current as R
    }

    prevRef.current = next
    return next as R
  }, [store])

  const result = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  // Run plugin onRender hooks
  const plugins = getPlugins()
  for (const plugin of plugins) {
    const bag = m.pluginBags.get(plugin.name)
    if (bag && bag.size > 0 && plugin.onRender) {
      const registryState = registry.pluginStates.get(plugin.name)
      plugin.onRender(bag, registryState)
    }
  }

  return result
}

function normalize(value: unknown, path: string, pluginBags: Map<string, PluginBag>): unknown {
  const plugins = getPlugins()
  for (const plugin of plugins) {
    const bag = pluginBags.get(plugin.name)
    if (!bag) continue
    const result = plugin.detect(value, path, bag)
    if (result !== null) {
      return result.initialValue
    }
  }

  if (!value || typeof value !== 'object') return value

  if (Array.isArray(value)) {
    return value.map((item, index) => normalize(item, `${path}[${index}]`, pluginBags))
  }

  // Preserve native objects (Date, File, Blob, Map, Set, etc.)
  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null) return value

  const out: Record<string, unknown> = {}
  for (const key of Object.keys(value)) {
    const nextPath = path ? `${path}.${key}` : key
    out[key] = normalize((value as Record<string, unknown>)[key], nextPath, pluginBags)
  }

  return out
}
