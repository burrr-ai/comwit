import { useEffect, useLayoutEffect, useMemo, useSyncExternalStore } from 'react'
import type { Model, StoreEntry } from './model'
import { useStoreRegistry } from './provider'

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

export type SearchParamBinding<T> = SearchParamSnapshot<T> & {
  /** Returns false before initialization, after cleanup, or for a stale revision. */
  set(value: T, options?: SearchParamSetOptions): boolean
  getSnapshot(): SearchParamSnapshot<T>
}

export type SearchParamOptions<T> = {
  key: string
  defaultValue: T
  /** Defaults to replace. Set push to add a browser history entry for each selection. */
  history?: RouterHistory
} & ([T] extends [string | null]
  ? { parse?: (raw: string | null) => T; serialize?: (value: T) => string | null }
  : { parse: (raw: string | null) => T; serialize: (value: T) => string | null })

const useCommitEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect
const urlBase = 'https://comwit.invalid'
const relativeURL = (url: URL) => `${url.pathname}${url.search}${url.hash}`

/**
 * Bind before this model's first selector read to expose its server URL value.
 * Browser state mutation and live subscriptions start only after commit.
 */
export function useSearchParam<T extends object, K extends keyof T>(
  model: Model<T>,
  field: K,
  options: SearchParamOptions<T[K]>
): SearchParamBinding<T[K]> {
  const registry = useStoreRegistry()
  const router = registry.router
  const store = registry.get(model)
  const { key, defaultValue, history = 'replace', parse, serialize } = options
  const initial = useMemo(() => {
    const raw = new URLSearchParams(registry.serverSearch ?? '').get(key)
    return store.prepareSearchParam(field, {
      ready: registry.serverSearch !== null,
      value:
        registry.serverSearch === null ? defaultValue : parse ? parse(raw) : (raw ?? defaultValue),
    }) as { ready: boolean; value: T[K] }
  }, [registry, store, field, key, defaultValue, parse])
  const controller = useMemo(
    () =>
      createBinding<T, K>(
        store,
        field,
        router,
        { key, defaultValue, history, parse, serialize },
        initial,
        () => {
          for (const owner of registry.searchParamOwners.values()) {
            if (owner.key === key || (owner.model === model.key && owner.field === field)) {
              throw new Error(`Search parameter "${key}" already has a binding in this Provider`)
            }
          }
          const owner = Symbol()
          registry.searchParamOwners.set(owner, { key, model: model.key, field })
          return () => registry.searchParamOwners.delete(owner)
        }
      ),
    [
      registry,
      store,
      model.key,
      router,
      field,
      key,
      defaultValue,
      history,
      parse,
      serialize,
      initial,
    ]
  )
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot
  )
  useCommitEffect(controller.start, [controller])
  return useMemo(
    () => ({ ...snapshot, set: controller.set, getSnapshot: controller.getSnapshot }),
    [snapshot, controller]
  )
}

function createBinding<T extends object, K extends keyof T>(
  store: StoreEntry<T>,
  field: K,
  router: RouterAdapter,
  options: {
    key: string
    defaultValue: T[K]
    history: RouterHistory
    parse?: (raw: string | null) => T[K]
    serialize?: (value: T[K]) => string | null
  },
  initial: { ready: boolean; value: T[K] },
  acquire: () => () => void
) {
  const parse = options.parse ?? ((raw: string | null) => (raw ?? options.defaultValue) as T[K])
  const serialize = options.serialize ?? ((value: T[K]) => value as string | null)
  const serverSnapshot: SearchParamSnapshot<T[K]> = {
    ...initial,
    revision: 0,
  }
  let snapshot: SearchParamSnapshot<T[K]> = { ready: false, value: store.proxy[field], revision: 0 }
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

  const emit = (value: T[K], ready = snapshot.ready, revision = snapshot.revision + 1) => {
    snapshot = { value, ready, revision }
    listeners.forEach((listener) => listener())
  }

  const apply = (value: T[K]) => {
    applying = true
    try {
      store.proxy[field] = value
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
      emit(store.proxy[field], false)
      return
    }
    const url = new URL(href, urlBase)
    const raw = url.searchParams.get(options.key)
    // A different query binding may have just written its key. Rebase our
    // pending selection on unrelated query/hash changes, but let navigation
    // changing this key or pathname cancel an obsolete local write.
    const keepPending = pending && snapshot.ready && raw === lastRaw && url.pathname === lastPath
    const value = keepPending ? store.proxy[field] : parse(raw)
    const changed =
      !snapshot.ready || url.pathname !== lastPath || serialize(value) !== serialize(snapshot.value)
    lastURL = href
    lastRaw = raw
    lastPath = url.pathname
    if (!keepPending) {
      pending = false
      if (serialize(store.proxy[field]) !== serialize(value)) apply(value)
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
    const value = serialize(store.proxy[field])
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
    const value = store.proxy[field]
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
        unsubscribeState = store.subscribe(onStateChange)
      } catch (error) {
        stop()
        throw error
      }
      return stop
    },
    set(value: T[K], setOptions: SearchParamSetOptions = {}) {
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
