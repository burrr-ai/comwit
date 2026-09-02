import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react'
import { createProxy, snapshot, subscribe } from './proxy'
import { getPlugins, type PluginBag } from './plugin'
import { useStoreRegistry } from './provider'
import { isEqual } from '../utils'
import { isSilent } from './silent'
import { COMPUTED_PLUGIN_NAME, createComputedProxy, getComputedSnapshot } from './computed'
import {
  createHistoryController,
  normalizeHistoryOptions,
  type HistoryApi,
  type HistoryConfig,
  type HistoryController,
  type HistoryOptions,
} from './history'
import { bindResourceState } from './query/bind'
import {
  commitQuerySelectorSuspenseLoads,
  createQuerySelectorState,
  prepareQuerySelectorSuspense,
  querySelectorLoadKey,
  runQuerySelectorLoads,
  type QuerySelectorLoad,
} from './query/select'
import { QUERY_PLUGIN_NAME } from './query/plugin'
import type {
  QueryBindingRegistry,
  QueryDefaultOptions,
  ResourceDescriptorMap,
  SelectableResourceState,
} from './query/types'

const useCommitEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export type StoreEntry<T extends object = any> = {
  proxy: T
  getSnapshot(): T
  subscribe(listener: () => void): () => void
  history?: HistoryController
}

export type ModelOptions<T extends object, D extends object = {}> = {
  derive?: (state: T) => { [K in keyof D]: () => D[K] }
  rules?: { [K in keyof T]?: (value: T[K]) => true | string }
  onObserve?: (state: T) => void | (() => void)
  history?: HistoryConfig
}

export type ValidationState<T> = {
  errors: { [K in keyof T]?: string | null }
  isValid: boolean
}

export function model<T extends object>(initial: T): Model<T>
export function model<T extends object, D extends object>(
  initial: T,
  options: ModelOptions<T, D> & { history: true | HistoryOptions }
): Model<T & Readonly<D> & { $validation: ValidationState<T>; $history: HistoryApi }>
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
    onObserve: options?.onObserve as Model<T & Readonly<D>>['onObserve'],
    instance(): StoreEntry<T & Readonly<D>> {
      const p = createProxy(cloneState())
      const historyOptions = normalizeHistoryOptions(options?.history)
      const history = historyOptions ? createHistoryController(p, historyOptions) : null

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
      const hasHistory = history != null
      const hasExtensions = derivedGetters != null || rules != null || hasComputed || hasHistory

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
            if (prop === '$history' && history) {
              return history.getApi()
            }
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
            if (prop === '$history') {
              throw new Error('Cannot set $history')
            }
            return Reflect.set(target, prop, value, receiver)
          },
        })
      } else if (history) {
        const base = publicProxy as object
        publicProxy = new Proxy(base, {
          get(target, prop, receiver) {
            if (prop === '$history') {
              return history.getApi()
            }
            return Reflect.get(target, prop, receiver)
          },
          set(target, prop, value, receiver) {
            if (prop === '$history') {
              throw new Error('Cannot set $history')
            }
            return Reflect.set(target, prop, value, receiver)
          },
        })
      }

      return {
        proxy: publicProxy as T & Readonly<D>,
        history: history ?? undefined,
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

          if (history) {
            result.$history = history.getApi()
          }

          return Object.freeze(result) as T & Readonly<D>
        },
        subscribe(listener) {
          const unsubProxy = subscribe(p, () => {
            if (!isSilent()) listener()
          })
          const unsubHistory = history?.subscribe(listener)
          return () => {
            unsubProxy()
            unsubHistory?.()
          }
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
  onObserve?: (state: T) => void | (() => void)
  instance(): StoreEntry<T>
}

export function useModel<T extends object>(m: Model<T>): T
export function useModel<T extends object, R>(
  m: Model<T>,
  selector: (state: SelectableResourceState<T>) => R
): R
export function useModel<T extends object, R>(
  m: Model<T>,
  selector?: (state: SelectableResourceState<T>) => R
): T | R {
  if (process.env.NODE_ENV !== 'production' && !selector) {
    console.warn(
      '[comwit] useModel() without a selector subscribes to the entire state tree, ' +
        'which may cause unnecessary re-renders. Consider using a selector: ' +
        'useModel(model, s => s.field)'
    )
  }

  const registry = useStoreRegistry()
  const store = registry.get(m)
  const queryBag = m.pluginBags.get(QUERY_PLUGIN_NAME) as ResourceDescriptorMap | undefined
  const queryRegistry = registry.pluginStates.get(QUERY_PLUGIN_NAME) as
    | QueryBindingRegistry
    | undefined
  const queryDefaults = registry.pluginDefaults.get(QUERY_PLUGIN_NAME) as
    | QueryDefaultOptions
    | undefined

  const queryController = useMemo(() => {
    if (!queryBag?.size || !queryRegistry) return store.proxy as object
    return bindResourceState(store.proxy, queryBag, queryDefaults, queryRegistry, m.key) as object
  }, [m.key, queryBag, queryDefaults, queryRegistry, store])

  const prevRef = useRef<unknown>(null)
  const selectorRef = useRef(selector)
  selectorRef.current = selector
  const queryLoadsRef = useRef<QuerySelectorLoad[]>([])

  const lifecycle = registry.getLifecycle(m)

  const subscribe = useCallback(
    (listener: () => void) => {
      lifecycle.subscriberCount++
      if (lifecycle.subscriberCount === 1) {
        notifySubscriberChange(m, registry, true)
        if (m.onObserve) {
          const result = m.onObserve(store.proxy)
          lifecycle.cleanup = typeof result === 'function' ? result : null
        }
      }
      const unsubProxy = store.subscribe(listener)
      return () => {
        unsubProxy()
        lifecycle.subscriberCount--
        if (lifecycle.subscriberCount === 0) {
          if (lifecycle.cleanup) {
            lifecycle.cleanup()
            lifecycle.cleanup = null
          }
          notifySubscriberChange(m, registry, false)
        }
      }
    },
    [store, lifecycle, m, registry]
  )

  const getSnapshot = useCallback(() => {
    const raw = store.getSnapshot()
    const loads: QuerySelectorLoad[] = []
    const selectable =
      queryBag?.size && queryRegistry
        ? createQuerySelectorState(raw, queryController, queryBag, queryRegistry, loads)
        : raw
    queryLoadsRef.current = loads
    const next = selectorRef.current
      ? selectorRef.current(selectable as SelectableResourceState<T>)
      : selectable

    if (prevRef.current !== null && isEqual(prevRef.current, next)) {
      return prevRef.current as R
    }

    prevRef.current = next
    return next as R
  }, [queryBag, queryController, queryRegistry, store])

  const result = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const queryLoads = queryLoadsRef.current
  const selectorLoadKey = querySelectorLoadKey(queryLoads)

  useCommitEffect(() => {
    if (!queryRegistry || queryLoads.length === 0) return
    commitQuerySelectorSuspenseLoads(queryLoads, queryRegistry)
  }, [queryRegistry, selectorLoadKey])

  useEffect(() => {
    if (!queryRegistry || queryLoads.length === 0) return
    runQuerySelectorLoads(queryLoads, queryRegistry)
  }, [queryRegistry, selectorLoadKey])

  if (queryRegistry) {
    prepareQuerySelectorSuspense(queryLoads, queryRegistry)
  }

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

function notifySubscriberChange(
  m: Model<any>,
  registry: ReturnType<typeof useStoreRegistry>,
  hasObservers: boolean
): void {
  const plugins = getPlugins()
  for (const plugin of plugins) {
    if (!plugin.onSubscriberChange) continue
    const bag = m.pluginBags.get(plugin.name)
    if (!bag || bag.size === 0) continue
    const registryState = registry.pluginStates.get(plugin.name)
    plugin.onSubscriberChange(m.key, bag, registryState, hasObservers)
  }
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
