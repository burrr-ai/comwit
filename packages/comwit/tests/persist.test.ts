import { describe, it, expect, vi } from 'vitest'
import { model } from '../src/core'
import { persist, persistPlugin, type PersistAdapter } from '../src/core/persist'

function createMapAdapter<T = unknown>(): PersistAdapter<T> & { store: Map<string, T> } {
  const store = new Map<string, T>()
  return {
    store,
    get: (key) => (store.has(key) ? (store.get(key) as T) : null),
    set: (key, value) => {
      store.set(key, value)
    },
    remove: (key) => {
      store.delete(key)
    },
  }
}

function createPersisted<T>(opts: {
  key: string
  defaultValue: T
  storage: PersistAdapter<T>
  debounceMs?: number
}) {
  const m = model({
    value: persist({ key: opts.key, defaultValue: opts.defaultValue, storage: opts.storage }),
  })
  const store = m.instance()
  const bag = m.pluginBags.get('persist')!
  const registryState = persistPlugin.createRegistryState()
  persistPlugin.bindState(store.proxy, bag, registryState, {
    debounceMs: opts.debounceMs ?? 100,
  })
  return store
}

describe('persist', () => {
  describe('hydration', () => {
    it('restores persisted value from storage on model creation', () => {
      const adapter = createMapAdapter<string>()
      adapter.store.set('theme', 'dark')
      const store = createPersisted({
        key: 'theme',
        defaultValue: 'light',
        storage: adapter,
      })
      expect(store.proxy.value).toBe('dark')
    })

    it('uses defaultValue when storage is empty', () => {
      const adapter = createMapAdapter<string>()
      const store = createPersisted({
        key: 'theme',
        defaultValue: 'light',
        storage: adapter,
      })
      expect(store.proxy.value).toBe('light')
    })

    it('restores numeric values from storage', () => {
      const adapter = createMapAdapter<number>()
      adapter.store.set('count', 42)
      const store = createPersisted({
        key: 'count',
        defaultValue: 0,
        storage: adapter,
      })
      expect(store.proxy.value).toBe(42)
    })
  })

  describe('write-back', () => {
    it('writes to storage when proxy value changes', async () => {
      const adapter = createMapAdapter<string>()
      const store = createPersisted({
        key: 'theme',
        defaultValue: 'light',
        storage: adapter,
        debounceMs: 10,
      })
      store.proxy.value = 'dark'
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(adapter.store.get('theme')).toBe('dark')
    })

    it('debounces writes to storage', async () => {
      const setSpy = vi.fn()
      const adapter: PersistAdapter<string> = {
        get: () => null,
        set: setSpy,
        remove: vi.fn(),
      }
      const store = createPersisted({
        key: 'theme',
        defaultValue: 'light',
        storage: adapter,
        debounceMs: 50,
      })
      store.proxy.value = 'a'
      store.proxy.value = 'b'
      store.proxy.value = 'c'
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(setSpy).not.toHaveBeenCalled()
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(setSpy).toHaveBeenCalledTimes(1)
      expect(setSpy).toHaveBeenCalledWith('theme', 'c')
    })
  })

  describe('custom adapter', () => {
    it('calls adapter get/set correctly', async () => {
      const adapter = createMapAdapter<string>()
      adapter.store.set('lang', 'ko')
      const store = createPersisted({
        key: 'lang',
        defaultValue: 'en',
        storage: adapter,
        debounceMs: 10,
      })
      expect(store.proxy.value).toBe('ko')
      store.proxy.value = 'ja'
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(adapter.store.get('lang')).toBe('ja')
    })

    it('supports adapter subscribe for cross-tab sync', () => {
      let externalCallback: ((value: number) => void) | null = null
      const adapter: PersistAdapter<number> = {
        get: () => null,
        set: vi.fn(),
        remove: vi.fn(),
        subscribe: (_key, cb) => {
          externalCallback = cb
          return () => {
            externalCallback = null
          }
        },
      }
      const store = createPersisted({
        key: 'count',
        defaultValue: 0,
        storage: adapter,
      })
      expect(store.proxy.value).toBe(0)
      externalCallback!(99)
      expect(store.proxy.value).toBe(99)
    })
  })

  describe('dynamic key (function form)', () => {
    it('hydrates using the key returned by the thunk at bind time', () => {
      const adapter = createMapAdapter<string>()
      adapter.store.set('comwit-tabs-proj-A', 'persisted-A')
      let projectId: string = 'proj-A'
      const store = createPersisted({
        key: () => `comwit-tabs-${projectId}`,
        defaultValue: 'default',
        storage: adapter,
      })
      expect(store.proxy.value).toBe('persisted-A')
    })

    it('falls back to defaultValue when the resolved key has no entry', () => {
      const adapter = createMapAdapter<string>()
      adapter.store.set('comwit-tabs-proj-A', 'persisted-A')
      let projectId: string = 'proj-B'
      const store = createPersisted({
        key: () => `comwit-tabs-${projectId}`,
        defaultValue: 'default',
        storage: adapter,
      })
      expect(store.proxy.value).toBe('default')
    })

    it('writes back to the current key when the thunk return value changes', async () => {
      const adapter = createMapAdapter<string>()
      let projectId: string = 'proj-A'
      const store = createPersisted({
        key: () => `comwit-tabs-${projectId}`,
        defaultValue: 'default',
        storage: adapter,
        debounceMs: 10,
      })
      // First write goes to proj-A
      store.proxy.value = 'a-value'
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(adapter.store.get('comwit-tabs-proj-A')).toBe('a-value')

      // Switch identity, write again — write must follow the new key
      projectId = 'proj-B'
      store.proxy.value = 'b-value'
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(adapter.store.get('comwit-tabs-proj-B')).toBe('b-value')
      // proj-A row remains untouched
      expect(adapter.store.get('comwit-tabs-proj-A')).toBe('a-value')
    })

    it('accepts a static string in the same field (backward compatible)', () => {
      const adapter = createMapAdapter<string>()
      adapter.store.set('static-key', 'persisted')
      const store = createPersisted({
        key: 'static-key',
        defaultValue: 'default',
        storage: adapter,
      })
      expect(store.proxy.value).toBe('persisted')
    })
  })

  describe('multiple persist fields', () => {
    it('handles multiple persist fields independently', () => {
      const nameAdapter = createMapAdapter<string>()
      const ageAdapter = createMapAdapter<number>()
      nameAdapter.store.set('name', 'Alice')

      const m = model({
        name: persist({ key: 'name', defaultValue: 'Guest', storage: nameAdapter }),
        age: persist({ key: 'age', defaultValue: 0, storage: ageAdapter }),
      })
      const store = m.instance()
      const bag = m.pluginBags.get('persist')!
      const registryState = persistPlugin.createRegistryState()
      persistPlugin.bindState(store.proxy, bag, registryState)

      expect(store.proxy.name).toBe('Alice')
      expect(store.proxy.age).toBe(0)
    })
  })
})
