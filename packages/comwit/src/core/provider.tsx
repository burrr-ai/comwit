import React, { createContext, useContext, useRef, type Context } from 'react'
import { getPlugins } from './plugin'
import type { Model, StoreEntry } from './model'
import type { StageMethodDecorator } from '../interceptors/utils'
import { getDevTools, initDevTools } from './devtools'
import type { LocalDefaults } from './local'
import type { QueryBindingRegistry } from './query/types'
import type { RouterAdapter, SearchParamDefinition } from './router'

export type RegistryDefaults = {
  interceptors?: StageMethodDecorator[]
  local?: LocalDefaults
  [pluginName: string]: unknown
}

export type ComwitProviderProps = {
  children: React.ReactNode
  context?: Record<string, unknown>
  defaultOptions?: RegistryDefaults
  /** Stable for this Provider's lifetime. Remount the Provider to replace it. */
  router?: RouterAdapter
}

export type LifecycleState = {
  subscriberCount: number
  cleanup: (() => void) | null
}

export type StoreRegistry = {
  resolve(model: Model<any>): StoreRegistry
  get<T extends object>(model: Model<T>): StoreEntry<T>
  getLifecycle(model: Model<any>): LifecycleState
  context?: Record<string, unknown>
  pluginStates: Map<string, unknown>
  pluginDefaults: Map<string, unknown>
  globalInterceptors?: StageMethodDecorator[]
  defaultOptions?: RegistryDefaults
  router?: RouterAdapter
  searchParamOwners: Map<symbol, { key: string; model: symbol; field: PropertyKey }>
  searchParamBootstrap?: {
    snapshot: string | null
    bindings: readonly SearchParamDefinition<any, any>[]
  }
}

// Lazily create the React Context the first time the provider or a hook is
// invoked. Calling createContext() at module top-level would crash the
// moment this module is evaluated under React Server Components (the
// RSC-vendored React build does not export createContext), even when only
// the proxy utilities (snapshot/isProxy) are needed at the import site.
let _StateContext: Context<StoreRegistry | null> | null = null
function getStateContext(): Context<StoreRegistry | null> {
  if (_StateContext === null) {
    _StateContext = createContext<StoreRegistry | null>(null)
  }
  return _StateContext
}

export function useStoreRegistry(): StoreRegistry {
  const ctx = useContext(getStateContext())
  if (!ctx) throw new Error('Wrap your app with <ComwitProvider>')
  return ctx
}

export function StoreRegistryProvider({
  registry,
  children,
}: {
  registry: StoreRegistry
  children: React.ReactNode
}) {
  const StateContext = getStateContext()
  return <StateContext.Provider value={registry}>{children}</StateContext.Provider>
}

/** Construct a private scope. Unowned models retain their parent's store and plugin registries. */
export function createStoreRegistry({
  defaultOptions,
  router,
  parent,
  initialValues,
}: {
  defaultOptions?: RegistryDefaults
  router?: RouterAdapter
  parent?: StoreRegistry
  initialValues?: ReadonlyMap<symbol, ReadonlyMap<PropertyKey, unknown>>
}): StoreRegistry {
  const pluginStates = new Map<string, unknown>()
  const pluginDefaults = parent?.pluginDefaults ?? new Map<string, unknown>()
  const allDefaults = parent?.defaultOptions ?? defaultOptions
  for (const plugin of getPlugins()) {
    const defaults = (
      parent ? parent.pluginDefaults.get(plugin.name) : defaultOptions?.[plugin.name]
    ) as Record<string, unknown> | undefined
    if (!parent) pluginDefaults.set(plugin.name, defaults)
    pluginStates.set(plugin.name, plugin.createRegistryState(defaults, allDefaults))
  }
  if (process.env.NODE_ENV !== 'production') initDevTools()
  const stores = new Map<symbol, StoreEntry>()
  const lifecycles = new Map<symbol, LifecycleState>()
  let ownInterceptors = defaultOptions?.interceptors
  let ownDefaults = defaultOptions
  const registry: StoreRegistry = {
    context: parent?.context ?? {},
    get globalInterceptors() {
      return parent ? parent.globalInterceptors : ownInterceptors
    },
    set globalInterceptors(value) {
      ownInterceptors = value
    },
    get defaultOptions() {
      return parent ? parent.defaultOptions : ownDefaults
    },
    set defaultOptions(value) {
      ownDefaults = value
    },
    pluginStates,
    pluginDefaults,
    router,
    searchParamOwners: new Map(),
    resolve(model) {
      return parent && !initialValues?.has(model.key) ? parent.resolve(model) : registry
    },
    get<T extends object>(model: Model<T>): StoreEntry<T> {
      const owner = registry.resolve(model)
      if (owner !== registry) return owner.get(model)
      const existing = stores.get(model.key)
      if (existing) return existing as StoreEntry<T>
      const entry = model.instance(initialValues?.get(model.key))
      stores.set(model.key, entry)
      // The global devtools registry is keyed only by model, not scope. A private
      // render must not register an abandoned shadow of its parent's model.
      if (process.env.NODE_ENV !== 'production' && !parent)
        getDevTools()?.registerStore(model, entry)
      return entry
    },
    getLifecycle(model) {
      const owner = registry.resolve(model)
      if (owner !== registry) return owner.getLifecycle(model)
      const existing = lifecycles.get(model.key)
      if (existing) return existing
      const lifecycle = { subscriberCount: 0, cleanup: null }
      lifecycles.set(model.key, lifecycle)
      return lifecycle
    },
  }
  const queryRegistry = pluginStates.get('query') as QueryBindingRegistry | undefined
  if (queryRegistry) {
    queryRegistry.getModelState = (source) => registry.get(source as Model<object>).proxy
  }
  return registry
}

export function ComwitProvider({
  children,
  defaultOptions,
  context = {},
  router,
}: ComwitProviderProps) {
  const registryRef = useRef<StoreRegistry>(null!)

  if (registryRef.current === null) {
    registryRef.current = createStoreRegistry({ defaultOptions, router })
  }

  const sharedContext = registryRef.current.context!
  Object.keys(sharedContext).forEach((key) => delete sharedContext[key])
  Object.assign(sharedContext, context)

  registryRef.current.globalInterceptors = defaultOptions?.interceptors
  registryRef.current.defaultOptions = defaultOptions

  // Update plugin defaults on each render
  const plugins = getPlugins()
  for (const plugin of plugins) {
    const defaults = defaultOptions?.[plugin.name] as Record<string, unknown> | undefined
    registryRef.current.pluginDefaults.set(plugin.name, defaults)
  }

  return <StoreRegistryProvider registry={registryRef.current}>{children}</StoreRegistryProvider>
}
