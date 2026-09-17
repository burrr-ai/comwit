import type { Model, StoreEntry } from './model'
import type { FieldPlugin } from './plugin'
import { createProxy, isProxy, snapshot as proxySnapshot } from './proxy'

const SEARCH_PARAM = Symbol('comwit-search-param')
const SEARCH_PARAM_ACCESS = Symbol('comwit-search-param-access')
declare const SEARCH_PARAM_WRITABLE: unique symbol
export const SEARCH_PARAM_PLUGIN_NAME = 'searchParam'
const urlBase = 'https://comwit.invalid'
const relativeURL = (url: URL) => `${url.pathname}${url.search}${url.hash}`

type SearchParamDescriptor<T = any> = {
  [SEARCH_PARAM]: true
  options: ResolvedSearchParamOptions<T>
}

type ResolvedSearchParamOptions<T> = {
  key: string
  defaultValue: T
  history: RouterHistory
  parse(raw: string | null): T
  serialize(value: T): string | null
}
type BaseSearchParamOptions<T> = { key: string; defaultValue?: T | null; history?: RouterHistory }
type StringSearchParamOptions = BaseSearchParamOptions<string> & {
  type?: 'string'
  parse?: (raw: string) => string
  serialize?: (value: string) => string | null
}
type NumberSearchParamOptions = BaseSearchParamOptions<number> & {
  type: 'number'
  parse?: (raw: string) => number
  serialize?: (value: number) => string | null
}
type BooleanSearchParamOptions = BaseSearchParamOptions<boolean> & {
  type: 'boolean'
  parse?: (raw: string) => boolean
  serialize?: (value: boolean) => string | null
}
type CustomSearchParamOptions<T> = BaseSearchParamOptions<T> & {
  type?: never
  parse: (raw: string) => T
  serialize: (value: NonNullable<T>) => string | null
}

export type SearchParamWritableState<T> = T & { readonly [SEARCH_PARAM_WRITABLE]: true }
type SearchParamPath<T, D extends unknown[] = []> = D['length'] extends 5
  ? never
  : T extends (...args: any[]) => any
    ? never
    : T extends readonly (infer Item)[]
      ? `${number}` | `${number}.${SearchParamPath<Item, [...D, unknown]>}`
      : T extends object
        ? {
            [K in Extract<keyof T, string>]: K | `${K}.${SearchParamPath<T[K], [...D, unknown]>}`
          }[Extract<keyof T, string>]
        : never
type PathValue<T, P extends string> = P extends `${infer Head}.${infer Tail}`
  ? PathValue<
      Head extends keyof NonNullable<T>
        ? NonNullable<T>[Head]
        : NonNullable<T> extends readonly (infer Item)[]
          ? Item
          : never,
      Tail
    >
  : P extends keyof NonNullable<T>
    ? NonNullable<T>[P]
    : NonNullable<T> extends readonly (infer Item)[]
      ? Item
      : never

type Controller = ReturnType<typeof createBinding<any>>
type SearchParamAccess = {
  id: object
  writable: boolean
  version: string
  get(path: string): SearchParamSnapshot<any>
  set?(path: string, value: unknown, options?: SearchParamSetOptions): boolean
}

function accessOf(state: unknown): SearchParamAccess | undefined {
  return state && typeof state === 'object' ? Reflect.get(state, SEARCH_PARAM_ACCESS) : undefined
}

function defineSearchParam(options: StringSearchParamOptions & { defaultValue: string }): string
function defineSearchParam(options: NumberSearchParamOptions & { defaultValue: number }): number
function defineSearchParam(options: BooleanSearchParamOptions & { defaultValue: boolean }): boolean
function defineSearchParam(options: StringSearchParamOptions): string | null
function defineSearchParam(options: NumberSearchParamOptions): number | null
function defineSearchParam(options: BooleanSearchParamOptions): boolean | null
function defineSearchParam<T>(options: SearchParamOptions<T> & { defaultValue: T }): T
function defineSearchParam<T>(options: SearchParamOptions<T>): T | null
function defineSearchParam(options: any): any {
  const fallback = options.defaultValue ?? null
  const kind = options.type ?? (options.parse && options.serialize ? 'custom' : 'string')
  const valid = (value: unknown) =>
    kind === 'custom' ||
    (kind === 'number'
      ? typeof value === 'number' && Number.isFinite(value)
      : typeof value === kind)
  if (fallback !== null && !valid(fallback))
    throw new TypeError(`Invalid defaultValue for ${kind} search parameter "${options.key}"`)
  const parse = (raw: string | null) => {
    if (raw === null) return fallback
    try {
      const text = raw.trim()
      const value = options.parse
        ? options.parse(raw)
        : kind === 'number'
          ? /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)
            ? Number(text)
            : null
          : kind === 'boolean'
            ? ['true', '1'].includes(text.toLowerCase())
              ? true
              : ['false', '0'].includes(text.toLowerCase())
                ? false
                : null
            : raw
      return value !== undefined && valid(value) ? value : fallback
    } catch {
      return fallback
    }
  }
  const serialize = (value: unknown): string | null => {
    if (value === null) return null
    if (!valid(value))
      throw new TypeError(`Invalid ${kind} value for search parameter "${options.key}"`)
    return options.serialize ? options.serialize(value) : String(value)
  }
  return {
    [SEARCH_PARAM]: true,
    options: Object.freeze({
      key: options.key,
      defaultValue: fallback,
      history: options.history ?? 'replace',
      parse,
      serialize,
    }),
  }
}

function getSearchParamSnapshot<S extends object, P extends SearchParamPath<S>>(
  state: S,
  path: P
): SearchParamSnapshot<PathValue<S, P>> {
  const access = accessOf(state)
  if (!access) throw new Error('searchParam.getSnapshot() requires Provider model state')
  return access.get(canonicalPath(path))
}

function setSearchParamValue<S extends object, P extends SearchParamPath<S>>(
  state: SearchParamWritableState<S>,
  path: P,
  value: NoInfer<PathValue<S, P>>,
  options?: SearchParamSetOptions
): boolean {
  const access = accessOf(state)
  if (!access?.writable)
    throw new Error('searchParam.set() requires action state, not a selector snapshot')
  return access.set!(canonicalPath(path), value, options)
}

/** Declare URL persistence in a model. The runtime field remains an ordinary value, like computed(). */
export const searchParam = Object.assign(defineSearchParam, {
  getSnapshot: getSearchParamSnapshot,
  set: setSearchParamValue,
})

export const searchParamPlugin: FieldPlugin = {
  name: SEARCH_PARAM_PLUGIN_NAME,
  detect(value, path, bag) {
    if (!value || typeof value !== 'object' || !(SEARCH_PARAM in value)) return null
    if (!path) throw new Error('searchParam() must be assigned to a model field')
    const descriptor = value as SearchParamDescriptor
    bag.set(canonicalPath(path), descriptor)
    return { initialValue: descriptor.options.defaultValue }
  },
  createRegistryState: () => null,
  bindState: (proxy) => proxy,
}

export function canonicalPath(path: string): string {
  return (path.match(/[^.[\]]+/g) ?? []).join('.')
}
export function getPathValue(state: object, path: string): unknown {
  let current: any = state
  for (const key of canonicalPath(path).split('.')) current = current?.[key]
  return current
}
export function setPathValue(state: object, path: string, value: unknown): void {
  const parts = canonicalPath(path).split('.')
  let current: any = state
  for (const part of parts.slice(0, -1)) {
    current = current?.[part]
    if (!current || typeof current !== 'object') throw new Error(`Missing model path: ${path}`)
  }
  if (!Object.prototype.hasOwnProperty.call(current, parts.at(-1)!))
    throw new Error(`Missing model field: ${path}`)
  current[parts.at(-1)!] = value
}

function cloneValue<T>(value: T): T {
  return structuredClone(isProxy(value) ? proxySnapshot(value as object) : value) as T
}
function snapshotValue<T>(value: T): T {
  if (isProxy(value)) return proxySnapshot(value as object) as T
  if (
    value &&
    typeof value === 'object' &&
    (Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype)
  ) {
    return proxySnapshot(createProxy(cloneValue(value)))
  }
  return value
}

export function serverSearchParamValues(
  model: Model<any>,
  search: string | null
): Map<PropertyKey, unknown> | undefined {
  if (search === null) return undefined
  const bag = model.pluginBags.get(SEARCH_PARAM_PLUGIN_NAME)
  if (!bag?.size) return undefined
  const params = new URLSearchParams(search)
  return new Map(
    [...bag].map(([path, value]) => {
      const options = (value as SearchParamDescriptor).options
      const raw = params.get(options.key)
      return [path, options.parse ? options.parse(raw) : (raw ?? options.defaultValue)]
    })
  )
}

function withAccess<T extends object>(state: T, access: SearchParamAccess): T {
  return new Proxy(state, {
    get: (target, prop, receiver) =>
      prop === SEARCH_PARAM_ACCESS ? access : Reflect.get(target, prop, receiver),
  })
}

export function inheritSearchParamAccess<T extends object>(source: object, target: T): T {
  const access = accessOf(source)
  return access ? withAccess(target, access) : target
}

export function sameSearchParamAccess(left: unknown, right: unknown): boolean {
  const a = accessOf(left),
    b = accessOf(right)
  return a?.id === b?.id && a?.version === b?.version
}

/** Prepare inert controllers and metadata at store creation. Only start() installs live subscriptions. */
export function prepareSearchParamStore(
  model: Model<any>,
  store: StoreEntry,
  router: RouterAdapter,
  serverSearch: string | null,
  owners: Map<string, { model: symbol; path: string }>
): { start(): () => void } | undefined {
  const bag = model.pluginBags.get(SEARCH_PARAM_PLUGIN_NAME)
  if (!bag?.size) return undefined
  const controllers = new Map<string, Controller>()
  const keys = new Set<string>()
  const params = new URLSearchParams(serverSearch ?? '')
  for (const [path, value] of bag) {
    const options = (value as SearchParamDescriptor).options
    if (keys.has(options.key)) throw new Error(`Duplicate search parameter: ${options.key}`)
    keys.add(options.key)
    const raw = params.get(options.key)
    const initial = store.prepareSearchParam(path, {
      ready: serverSearch !== null,
      value:
        serverSearch === null
          ? options.defaultValue
          : options.parse
            ? options.parse(raw)
            : (raw ?? options.defaultValue),
    })
    controllers.set(
      path,
      createBinding(
        store,
        path,
        router,
        { ...options, history: options.history ?? 'replace' },
        initial,
        () => {
          if (owners.has(options.key))
            throw new Error(
              `Search parameter "${options.key}" already has an active model in this Provider`
            )
          const owner = { model: model.key, path }
          owners.set(options.key, owner)
          return () => {
            if (owners.get(options.key) === owner) owners.delete(options.key)
          }
        }
      )
    )
  }
  const controllerAt = (path: string) => {
    const controller = controllers.get(path)
    if (!controller) throw new Error(`Model field "${path}" is not declared with searchParam()`)
    return controller
  }
  const id = {}
  store.proxy = withAccess(store.proxy, {
    id,
    writable: true,
    version: '',
    get: (path) =>
      typeof window === 'undefined'
        ? controllerAt(path).getServerSnapshot()
        : controllerAt(path).getSnapshot(),
    set: (path, value, options) => controllerAt(path).set(value, options),
  })
  const originalSnapshot = store.getSnapshot
  const originalServerSnapshot = store.getServerSnapshot ?? originalSnapshot
  type Cache = { raw: object; states: SearchParamSnapshot<any>[]; view: object }
  const caches: { live?: Cache; server?: Cache } = {}
  const decorate = (raw: object, server: boolean) => {
    const mode = server ? 'server' : 'live'
    const states = [...controllers.values()].map((controller) =>
      server ? controller.getServerSnapshot() : controller.getSnapshot()
    )
    const cache = caches[mode]
    if (cache?.raw === raw && states.every((state, index) => state === cache.states[index]))
      return cache.view
    const entries = new Map([...controllers.keys()].map((path, index) => [path, states[index]]))
    const view = withAccess(raw, {
      id,
      writable: false,
      version: states.map((state) => `${state.ready}:${state.revision}`).join('|'),
      get: (path) => {
        controllerAt(path)
        return entries.get(path)!
      },
    })
    caches[mode] = { raw, states, view }
    return view
  }
  store.getSnapshot = () => decorate(originalSnapshot(), false)
  store.getServerSnapshot = () => decorate(originalServerSnapshot(), true)
  const originalSubscribe = store.subscribe
  store.subscribe = (listener) => {
    const stops = [
      originalSubscribe(listener),
      ...[...controllers.values()].map((controller) => controller.subscribe(listener)),
    ]
    return () => stops.forEach((stop) => stop())
  }
  return {
    start() {
      const stops: Array<() => void> = []
      try {
        for (const controller of controllers.values()) stops.push(controller.start())
      } catch (error) {
        stops.reverse().forEach((stop) => stop())
        throw error
      }
      return () => stops.reverse().forEach((stop) => stop())
    },
  }
}

export type RouterHistory = 'push' | 'replace'
export type RouterNavigateOptions = { history: RouterHistory }

/** A committed URL source. navigate must update getSnapshot synchronously. */
export type RouterAdapter = {
  /** A pathname, search and hash (or absolute URL); null while unavailable. */
  getSnapshot(): string | null
  subscribe(listener: () => void): () => void
  navigate(href: string, options: RouterNavigateOptions): void
}

export type SearchParamSnapshot<T> = {
  ready: boolean
  value: T
  /** Changes on URL navigation and local selection. Use to reject stale async work. */
  revision: number
}

export type SearchParamSetOptions = {
  /** Overrides the binding's history mode for this write only. */
  history?: RouterHistory
  ifRevision?: number
}

export type SearchParamOptions<T = string | null> =
  | CustomSearchParamOptions<T>
  | ([NonNullable<T>] extends [string]
      ? StringSearchParamOptions
      : [NonNullable<T>] extends [number]
        ? NumberSearchParamOptions
        : [NonNullable<T>] extends [boolean]
          ? BooleanSearchParamOptions
          : never)

function createBinding<T>(
  store: StoreEntry,
  path: string,
  router: RouterAdapter,
  options: {
    key: string
    defaultValue: T
    history: RouterHistory
    parse?: (raw: string | null) => T
    serialize?: (value: T) => string | null
  },
  initial: { ready: boolean; value: T },
  acquire: () => () => void
) {
  const subscribeState = store.subscribe
  const parse = options.parse ?? ((raw: string | null) => (raw ?? options.defaultValue) as T)
  const serialize = options.serialize ?? ((value: T) => value as string | null)
  const serverSnapshot: SearchParamSnapshot<T> = Object.freeze({
    ...initial,
    value: snapshotValue(initial.value),
    revision: 0,
  })
  let snapshot: SearchParamSnapshot<T> = {
    ready: false,
    value: getPathValue(store.proxy, path) as T,
    revision: 0,
  }
  const listeners = new Set<() => void>()
  let active = false
  let applying = false
  let pending = false
  let generation = 0
  let lastURL: string | null = null
  let lastRaw: string | null = null
  let lastPath: string | null = null
  let initialized = false
  let serverSnapshotRead = false
  let lastValue = serialize(snapshot.value)

  const emit = (value: T, ready = snapshot.ready, revision = snapshot.revision + 1) => {
    snapshot = Object.freeze({ value: snapshotValue(value), ready, revision })
    listeners.forEach((listener) => listener())
  }

  const apply = (value: T) => {
    applying = true
    try {
      setPathValue(store.proxy, path, cloneValue(value))
      lastValue = serialize(value)
    } finally {
      applying = false
    }
  }

  const readURL = () => {
    if (!active) return
    const href = router.getSnapshot()
    if (href === lastURL && (href === null || snapshot.ready)) return
    if (href === null) {
      lastURL = null
      pending = false
      emit(getPathValue(store.proxy, path) as T, false)
      return
    }
    const url = new URL(href, urlBase)
    const raw = url.searchParams.get(options.key)
    // A different query binding may have just written its key. Rebase our
    // pending selection on unrelated query/hash changes, but let navigation
    // changing this key or pathname cancel an obsolete local write.
    const keepPending = pending && snapshot.ready && raw === lastRaw && url.pathname === lastPath
    const value = keepPending ? (getPathValue(store.proxy, path) as T) : parse(raw)
    const changed =
      !snapshot.ready || url.pathname !== lastPath || serialize(value) !== serialize(snapshot.value)
    lastURL = href
    lastRaw = raw
    lastPath = url.pathname
    if (!keepPending) {
      pending = false
      if (serialize(getPathValue(store.proxy, path) as T) !== serialize(value)) apply(value)
    }
    if (!initialized) {
      initialized = true
      const sameServerValue =
        serverSnapshotRead && initial.ready && serialize(value) === serialize(initial.value)
      emit(value, true, sameServerValue ? 0 : 1)
    } else if (changed) emit(value, true)
  }

  const writeURL = (history: RouterHistory) => {
    readURL()
    if (!active || !snapshot.ready || !pending || lastURL === null) return
    const url = new URL(lastURL, urlBase)
    const value = serialize(getPathValue(store.proxy, path) as T)
    if (value === null) url.searchParams.delete(options.key)
    else url.searchParams.set(options.key, value)
    pending = false
    const href = relativeURL(url)
    if (href === relativeURL(new URL(lastURL, urlBase))) return
    router.navigate(href, { history })
    // Includes synchronous custom adapters and redirects. Browser adapters
    // notify in a microtask, so explicitly consume our own committed write.
    readURL()
  }

  const onStateChange = () => {
    if (!active || applying || !snapshot.ready) return
    const value = getPathValue(store.proxy, path) as T
    const serialized = serialize(value)
    if (serialized === lastValue) return
    lastValue = serialized
    pending = true
    emit(value)
    const currentGeneration = generation
    queueMicrotask(() => {
      if (active && generation === currentGeneration) writeURL(options.history)
    })
  }

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot() {
      serverSnapshotRead = true
      return serverSnapshot
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    start() {
      const release = acquire()
      active = true
      generation++
      let unsubscribeRouter: (() => void) | undefined
      let unsubscribeState: (() => void) | undefined
      const stop = () => {
        active = false
        pending = false
        generation++
        unsubscribeState?.()
        unsubscribeRouter?.()
        release()
        snapshot = { ...snapshot, ready: false, revision: snapshot.revision + 1 }
      }
      try {
        // Subscribe before reading so URL changes around mount cannot be lost.
        unsubscribeRouter = router.subscribe(readURL)
        readURL()
        unsubscribeState = subscribeState(onStateChange)
      } catch (error) {
        stop()
        throw error
      }
      return stop
    },
    set(value: T, setOptions: SearchParamSetOptions = {}) {
      if (!active) return false
      readURL()
      if (!snapshot.ready) return false
      if (setOptions.ifRevision !== undefined && setOptions.ifRevision !== snapshot.revision) {
        return false
      }
      const changed = serialize(value) !== lastValue
      apply(value)
      pending = true
      if (changed) emit(value)
      writeURL(setOptions.history ?? options.history)
      return true
    },
  }
}

type HistoryHub = { listeners: Set<() => void>; stop(): void }
// Only the browser event transport is shared. Model state and bindings remain
// Provider-scoped, and the final unsubscribe releases every browser listener.
const historyHubs = new WeakMap<Window, HistoryHub>()

function subscribeHistory(target: Window, listener: () => void): () => void {
  let hub = historyHubs.get(target)
  if (!hub) {
    const listeners = new Set<() => void>()
    const { history } = target
    const originalPush = history.pushState
    const originalReplace = history.replaceState
    let lastHref = target.location.href
    let queued = false
    const notify = () => {
      if (queued) return
      queued = true
      // Next commits history in an insertion effect. Notify outside React's
      // commit phase, and coalesce several history writes in the same tick.
      queueMicrotask(() => {
        queued = false
        if (target.location.href === lastHref) return
        lastHref = target.location.href
        listeners.forEach((callback) => callback())
      })
    }
    const push: History['pushState'] = function (this: History, ...args) {
      originalPush.apply(this, args)
      notify()
    }
    const replace: History['replaceState'] = function (this: History, ...args) {
      originalReplace.apply(this, args)
      notify()
    }
    history.pushState = push
    history.replaceState = replace
    target.addEventListener('popstate', notify)
    target.addEventListener('hashchange', notify)
    hub = {
      listeners,
      stop() {
        target.removeEventListener('popstate', notify)
        target.removeEventListener('hashchange', notify)
        // Never replace a wrapper another router installed after ours.
        if (history.pushState === push) history.pushState = originalPush
        if (history.replaceState === replace) history.replaceState = originalReplace
        historyHubs.delete(target)
      },
    }
    historyHubs.set(target, hub)
  }
  const currentHub = hub
  currentHub.listeners.add(listener)
  return () => {
    currentHub.listeners.delete(listener)
    if (currentHub.listeners.size === 0) currentHub.stop()
  }
}

/** Native History API adapter, including Next App Router's history integration. */
export function createBrowserRouterAdapter(target?: Window): RouterAdapter {
  const getWindow = () => target ?? (typeof window === 'undefined' ? undefined : window)
  return {
    getSnapshot() {
      const current = getWindow()
      return current ? relativeURL(new URL(current.location.href)) : null
    },
    subscribe(listener) {
      const current = getWindow()
      return current ? subscribeHistory(current, listener) : () => {}
    },
    navigate(href, { history }) {
      const current = getWindow()
      if (!current) return
      const url = new URL(href, current.location.href)
      if (url.origin !== current.location.origin) {
        throw new Error('Browser router navigation must stay on the current origin')
      }
      // null lets framework wrappers attach their own internal history state.
      current.history[history === 'push' ? 'pushState' : 'replaceState'](null, '', relativeURL(url))
    },
  }
}
