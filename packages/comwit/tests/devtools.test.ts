import { model } from '../src/core'
import { initDevTools, getDevTools } from '../src/core/devtools'
import type { ComwitDevTools } from '../src/core/devtools'

describe('devtools', () => {
  let devtools: ComwitDevTools

  beforeEach(() => {
    delete globalThis.__COMWIT_DEVTOOLS__
    devtools = initDevTools()!
  })

  afterEach(() => {
    delete globalThis.__COMWIT_DEVTOOLS__
  })

  test('initDevTools creates global __COMWIT_DEVTOOLS__', () => {
    expect(globalThis.__COMWIT_DEVTOOLS__).toBeDefined()
    expect(globalThis.__COMWIT_DEVTOOLS__).toBe(devtools)
  })

  test('initDevTools returns existing instance on repeated calls', () => {
    const second = initDevTools()
    expect(second).toBe(devtools)
  })

  test('getDevTools returns the global instance', () => {
    expect(getDevTools()).toBe(devtools)
  })

  test('getDevTools returns undefined when not initialized', () => {
    delete globalThis.__COMWIT_DEVTOOLS__
    expect(getDevTools()).toBeUndefined()
  })

  describe('store registration', () => {
    test('registerStore adds a store and allows snapshot inspection', () => {
      const m = model({ count: 0 })
      const entry = m.instance()

      devtools.registerStore(m, entry)

      expect(devtools.stores.size).toBe(1)
      const info = devtools.getStoreSnapshot(m)
      expect(info).not.toBeNull()
      expect(info!.state).toEqual({ count: 0 })
    })

    test('registerStore is idempotent', () => {
      const m = model({ count: 0 })
      const entry = m.instance()

      devtools.registerStore(m, entry)
      devtools.registerStore(m, entry)

      expect(devtools.stores.size).toBe(1)
    })

    test('getStoreSnapshot returns null for unregistered model', () => {
      const m = model({ count: 0 })
      expect(devtools.getStoreSnapshot(m)).toBeNull()
    })

    test('getStoreSnapshot reflects mutations', () => {
      const m = model({ count: 0 })
      const entry = m.instance()
      devtools.registerStore(m, entry)

      entry.proxy.count = 42

      const info = devtools.getStoreSnapshot(m)
      expect(info!.state).toEqual({ count: 42 })
    })
  })

  describe('action log', () => {
    test('logAction adds entries to actionLog', () => {
      devtools.logAction({
        name: 'increment',
        args: [1],
        result: undefined,
        timestamp: Date.now(),
      })

      expect(devtools.actionLog).toHaveLength(1)
      expect(devtools.actionLog[0].name).toBe('increment')
    })

    test('ring buffer drops oldest entries when exceeding maxActionLogSize', () => {
      devtools.maxActionLogSize = 3

      for (let i = 0; i < 5; i++) {
        devtools.logAction({
          name: `action-${i}`,
          args: [],
          timestamp: Date.now(),
        })
      }

      expect(devtools.actionLog).toHaveLength(3)
      expect(devtools.actionLog[0].name).toBe('action-2')
      expect(devtools.actionLog[1].name).toBe('action-3')
      expect(devtools.actionLog[2].name).toBe('action-4')
    })

    test('custom maxLogSize via initDevTools options', () => {
      delete globalThis.__COMWIT_DEVTOOLS__
      const dt = initDevTools({ maxLogSize: 10 })!
      expect(dt.maxActionLogSize).toBe(10)
    })
  })

  describe('event subscription', () => {
    test('subscribe to action events fires on logAction', () => {
      const handler = vi.fn()
      devtools.subscribe('action', handler)

      devtools.logAction({
        name: 'test',
        args: [],
        timestamp: Date.now(),
      })

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0].type).toBe('action')
      expect(handler.mock.calls[0][0].payload.name).toBe('test')
    })

    test('subscribe to state-change events fires on store mutation', async () => {
      const handler = vi.fn()
      devtools.subscribe('state-change', handler)

      const m = model({ count: 0 })
      const entry = m.instance()
      devtools.registerStore(m, entry)

      entry.proxy.count = 10

      // Wait for microtask-batched notification
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0].type).toBe('state-change')
    })

    test('subscribe to query events via _emit', () => {
      const handler = vi.fn()
      devtools.subscribe('query', handler)

      devtools._emit('query', { path: 'users', status: 'loading' })

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0].payload).toEqual({ path: 'users', status: 'loading' })
    })

    test('unsubscribe removes handler', () => {
      const handler = vi.fn()
      const unsub = devtools.subscribe('action', handler)

      unsub()

      devtools.logAction({ name: 'test', args: [], timestamp: Date.now() })
      expect(handler).not.toHaveBeenCalled()
    })

    test('multiple subscribers receive events independently', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      devtools.subscribe('action', handler1)
      const unsub2 = devtools.subscribe('action', handler2)

      devtools.logAction({ name: 'a', args: [], timestamp: Date.now() })
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)

      unsub2()

      devtools.logAction({ name: 'b', args: [], timestamp: Date.now() })
      expect(handler1).toHaveBeenCalledTimes(2)
      expect(handler2).toHaveBeenCalledTimes(1)
    })
  })
})
