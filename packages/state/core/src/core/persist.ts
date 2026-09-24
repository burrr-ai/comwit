import { subscribe } from './proxy'
import { silent } from './silent'
import { debounce } from '../utils'
import type { FieldPlugin, PluginBag } from './plugin'

const PERSIST_BRAND = Symbol('comwit-persist')

export type PersistAdapter<T = unknown> = {
  get(key: string): T | null
  set(key: string, value: T): void
  remove(key: string): void
  subscribe?(key: string, callback: (value: T) => void): () => void
}

export type PersistOptions<T> = {
  key: string
  defaultValue: T
  storage?: 'localStorage' | 'sessionStorage' | PersistAdapter<T>
  serialize?: (value: T) => string
  deserialize?: (raw: string) => T
}

export type PersistDescriptor<T = unknown> = {
  [PERSIST_BRAND]: true
  key: string
  defaultValue: T
  adapter: PersistAdapter<T>
  serialize: (value: T) => string
  deserialize: (raw: string) => T
}

export type PersistDefaults = {
  debounceMs?: number
}

function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined' &&
    typeof window.localStorage.getItem === 'function'
  )
}

function createWebStorageAdapter<T>(
  storageKey: 'localStorage' | 'sessionStorage',
  serialize: (value: T) => string,
  deserialize: (raw: string) => T
): PersistAdapter<T> {
  const adapter: PersistAdapter<T> = {
    get(key: string): T | null {
      if (!isBrowser()) return null
      try {
        const raw = window[storageKey].getItem(key)
        if (raw === null) return null
        return deserialize(raw)
      } catch {
        return null
      }
    },
    set(key: string, value: T): void {
      if (!isBrowser()) return
      try {
        window[storageKey].setItem(key, serialize(value))
      } catch {
        // quota exceeded or other storage error
      }
    },
    remove(key: string): void {
      if (!isBrowser()) return
      try {
        window[storageKey].removeItem(key)
      } catch {}
    },
  }

  if (storageKey === 'localStorage') {
    adapter.subscribe = (key: string, callback: (value: T) => void): (() => void) => {
      if (!isBrowser()) return () => {}
      const handler = (e: StorageEvent) => {
        if (e.key !== key || e.storageArea !== window.localStorage) return
        if (e.newValue === null) return
        try {
          callback(deserialize(e.newValue))
        } catch {}
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    }
  }

  return adapter
}

export function persist<T>(options: PersistOptions<T>): PersistDescriptor<T> {
  const serialize = options.serialize ?? ((v: T) => JSON.stringify(v))
  const deserialize = options.deserialize ?? ((raw: string) => JSON.parse(raw) as T)

  let adapter: PersistAdapter<T>
  if (!options.storage || options.storage === 'localStorage') {
    adapter = createWebStorageAdapter<T>('localStorage', serialize, deserialize)
  } else if (options.storage === 'sessionStorage') {
    adapter = createWebStorageAdapter<T>('sessionStorage', serialize, deserialize)
  } else {
    adapter = options.storage
  }

  return {
    [PERSIST_BRAND]: true,
    key: options.key,
    defaultValue: options.defaultValue,
    adapter,
    serialize,
    deserialize,
  }
}

export function isPersistDescriptor(value: unknown): value is PersistDescriptor {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [PERSIST_BRAND]?: unknown })[PERSIST_BRAND] === true
  )
}

// --- Binding logic ---

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.')
  let current: unknown = obj
  for (const k of keys) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[k]
  }
  return current
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.')
  let current: Record<string, unknown> = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const next = current[keys[i]]
    if (next === null || next === undefined || typeof next !== 'object') return
    current = next as Record<string, unknown>
  }
  current[keys[keys.length - 1]] = value
}

type PersistRegistryState = {
  cleanups: Map<symbol, Array<() => void>>
}

function createPersistRegistryState(): PersistRegistryState {
  return { cleanups: new Map() }
}

export function bindPersistState(
  proxy: Record<string, unknown>,
  bag: PluginBag,
  registryState: PersistRegistryState,
  defaults?: PersistDefaults
): void {
  const debounceMs = defaults?.debounceMs ?? 100

  for (const [path, value] of bag) {
    const descriptor = value as PersistDescriptor
    const { key, adapter, defaultValue } = descriptor
    const cleanups: Array<() => void> = []

    // Hydrate from storage
    const stored = adapter.get(key)
    silent(() => {
      if (stored !== null) {
        setNestedValue(proxy, path, stored)
      } else {
        setNestedValue(proxy, path, defaultValue)
      }
    })

    // Subscribe to proxy changes and write back (debounced)
    const writeBack = debounce(() => {
      const currentValue = getNestedValue(proxy, path)
      adapter.set(key, currentValue)
    }, debounceMs)

    const unsub = subscribe(proxy, () => {
      writeBack()
    })
    cleanups.push(unsub)
    cleanups.push(() => writeBack.cancel())

    // Cross-tab sync
    if (adapter.subscribe) {
      const unsubStorage = adapter.subscribe(key, (newValue) => {
        silent(() => {
          setNestedValue(proxy, path, newValue)
        })
      })
      cleanups.push(unsubStorage)
    }
  }
}

// --- Plugin definition ---

export const persistPlugin: FieldPlugin = {
  name: 'persist',

  detect(value: unknown, path: string, bag: PluginBag) {
    if (!isPersistDescriptor(value)) return null
    if (!path) throw new Error('persist() entry must be assigned to a model field')
    bag.set(path, value)
    return { initialValue: value.defaultValue }
  },

  createRegistryState(_defaults?: Record<string, unknown>): PersistRegistryState {
    return createPersistRegistryState()
  },

  bindState(
    proxy: object,
    bag: PluginBag,
    registryState: unknown,
    defaults?: Record<string, unknown>
  ): object {
    if (bag.size === 0) return proxy
    bindPersistState(
      proxy as Record<string, unknown>,
      bag,
      registryState as PersistRegistryState,
      defaults as PersistDefaults | undefined
    )
    return proxy
  },
}
