import React, {
  createContext,
  useContext,
  useId,
  useRef,
  useEffect,
  useLayoutEffect,
  type Context,
} from 'react'
import { getPlugins } from './plugin'
import type { Model, StoreEntry } from './model'
import type { StageMethodDecorator } from '../interceptors/utils'
import { getDevTools, initDevTools } from './devtools'
import type { LocalDefaults } from './local'
import type { QueryBindingRegistry } from './query/types'
import {
  createBrowserRouterAdapter,
  prepareSearchParamStore,
  serverSearchParamValues,
  type RouterAdapter,
} from './router'

const useCommitEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export type RegistryDefaults = {
  interceptors?: StageMethodDecorator[]
  local?: LocalDefaults
  [pluginName: string]: unknown
}

export type ComwitProviderProps = {
  children: React.ReactNode
  context?: Record<string, unknown>
  defaultOptions?: RegistryDefaults
  /** Read once during server rendering. Return null when request search is unavailable. Never called in the browser. */
  getServerSearchParams?: () => string | null
}

export type LifecycleState = {
  subscriberCount: number
  cleanup: (() => void) | null
}

export type StoreRegistry = {
  get<T extends object>(model: Model<T>): StoreEntry<T>
  getLifecycle(model: Model<any>): LifecycleState
  observe(model: Model<any>): () => void
  dispose(): void
  context?: Record<string, unknown>
  pluginStates: Map<string, unknown>
  pluginDefaults: Map<string, unknown>
  globalInterceptors?: StageMethodDecorator[]
  /** Internal URL transport; ordinary model hooks do not subscribe to it. */
  router: RouterAdapter
  serverSearch: string | null
  searchParamOwners: Map<string, { model: symbol; path: string }>
}

let _StateContext: Context<StoreRegistry | null> | null = null
function getStateContext(): Context<StoreRegistry | null> {
  if (_StateContext === null) _StateContext = createContext<StoreRegistry | null>(null)
  return _StateContext
}

export function useStoreRegistry(): StoreRegistry {
  const ctx = useContext(getStateContext())
  if (!ctx) throw new Error('Wrap your app with <ComwitProvider>')
  return ctx
}

function readServerSearch(id: string): string | null {
  const element = document.getElementById(id)
  if (
    !element ||
    element.tagName.toLowerCase() !== 'script' ||
    !element.hasAttribute('data-comwit-search')
  )
    return null
  try {
    const value: unknown = JSON.parse(element.textContent ?? 'null')
    return typeof value === 'string' ? value : null
  } catch {
    return null
  }
}

function serializeServerSearch(search: string | null): string {
  return JSON.stringify(search)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export function ComwitProvider({
  children,
  defaultOptions,
  context = {},
  getServerSearchParams,
}: ComwitProviderProps) {
  const id = `comwit-search-${useId()}`
  const registryRef = useRef<StoreRegistry>(null!)
  const transfer = useRef(Boolean(getServerSearchParams))

  if (registryRef.current === null) {
    const serverSearch =
      typeof window === 'undefined'
        ? (getServerSearchParams?.() ?? null)
        : transfer.current
          ? readServerSearch(id)
          : null
    if (serverSearch !== null && typeof serverSearch !== 'string') {
      throw new TypeError('getServerSearchParams() must synchronously return a string or null')
    }
    const pluginStates = new Map<string, unknown>()
    const pluginDefaults = new Map<string, unknown>()
    for (const plugin of getPlugins()) {
      const defaults = defaultOptions?.[plugin.name] as Record<string, unknown> | undefined
      pluginDefaults.set(plugin.name, defaults)
      pluginStates.set(plugin.name, plugin.createRegistryState(defaults, defaultOptions))
    }
    // Server requests must not retain their model instances in a global debug registry.
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') initDevTools()
    const stores = new Map<symbol, StoreEntry>()
    const lifecycles = new Map<symbol, LifecycleState>()
    const urlModels = new Map<symbol, { start(): () => void }>()
    const urlObservers = new Map<symbol, { count: number; stop(): void }>()
    const registry: StoreRegistry = {
      context: {},
      pluginStates,
      pluginDefaults,
      serverSearch,
      router: createBrowserRouterAdapter(),
      searchParamOwners: new Map(),
      get<T extends object>(model: Model<T>): StoreEntry<T> {
        const existing = stores.get(model.key)
        if (existing) return existing as StoreEntry<T>
        const initial =
          typeof window === 'undefined' ? serverSearchParamValues(model, serverSearch) : undefined
        const entry = model.instance(initial)
        const url = prepareSearchParamStore(
          model,
          entry,
          registry.router,
          serverSearch,
          registry.searchParamOwners
        )
        if (url) urlModels.set(model.key, url)
        stores.set(model.key, entry)
        if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined')
          getDevTools()?.registerStore(model, entry)
        return entry
      },
      getLifecycle(model) {
        const existing = lifecycles.get(model.key)
        if (existing) return existing
        const lifecycle = { subscriberCount: 0, cleanup: null }
        lifecycles.set(model.key, lifecycle)
        return lifecycle
      },
      observe(model) {
        registry.get(model)
        const url = urlModels.get(model.key)
        if (!url) return () => {}
        let state = urlObservers.get(model.key)
        if (!state) {
          state = { count: 0, stop: url.start() }
          urlObservers.set(model.key, state)
        }
        state.count++
        const current = state
        return () => {
          if (urlObservers.get(model.key) !== current) return
          if (--current.count === 0) {
            urlObservers.delete(model.key)
            current.stop()
          }
        }
      },
      dispose() {
        for (const state of urlObservers.values()) state.stop()
        urlObservers.clear()
      },
    }
    const queryRegistry = pluginStates.get('query') as QueryBindingRegistry | undefined
    if (queryRegistry)
      queryRegistry.getModelState = (source) => registry.get(source as Model<object>).proxy
    registryRef.current = registry
  }

  const registry = registryRef.current
  useCommitEffect(() => () => registry.dispose(), [registry])
  const sharedContext = registry.context!
  Object.keys(sharedContext).forEach((key) => delete sharedContext[key])
  Object.assign(sharedContext, context)
  registry.globalInterceptors = defaultOptions?.interceptors
  for (const plugin of getPlugins()) {
    registry.pluginDefaults.set(plugin.name, defaultOptions?.[plugin.name])
  }
  const StateContext = getStateContext()
  return (
    <StateContext.Provider value={registry}>
      {transfer.current ? (
        <>
          <script
            id={id}
            type="application/json"
            data-comwit-search=""
            dangerouslySetInnerHTML={{ __html: serializeServerSearch(registry.serverSearch) }}
          />
          <React.Fragment key="models">{children}</React.Fragment>
        </>
      ) : (
        children
      )}
    </StateContext.Provider>
  )
}
