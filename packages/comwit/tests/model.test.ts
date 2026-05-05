import { model, silent, query, snapshot, isProxy } from '../src/core'
import { isSilent } from '../src/core/silent'
import {
  bindResourceState,
  createQueryBindingRegistry,
  type ResourceDescriptorMap,
} from '../src/core/query'

describe('model()', () => {
  test('creates a Model with key, pluginBags, and instance()', () => {
    const m = model({ count: 0 })

    expect(typeof m.key).toBe('symbol')
    expect(m.pluginBags).toBeInstanceOf(Map)
    expect(typeof m.instance).toBe('function')
  })

  test('instance() returns StoreEntry with proxy, getSnapshot, subscribe', () => {
    const m = model({ count: 0 })
    const store = m.instance()

    expect(store.proxy).toBeDefined()
    expect(typeof store.getSnapshot).toBe('function')
    expect(typeof store.subscribe).toBe('function')
  })

  test('proxy mutation reflects in getSnapshot', () => {
    const m = model({ count: 0 })
    const store = m.instance()

    store.proxy.count = 42

    const snap = store.getSnapshot()
    expect(snap.count).toBe(42)
  })

  test('getSnapshot returns immutable snapshot', () => {
    const m = model({ count: 0 })
    const store = m.instance()

    store.proxy.count = 10
    const snap = store.getSnapshot()

    expect(() => {
      ;(snap as any).count = 99
    }).toThrow()
  })

  test('subscribe fires listener on proxy mutation', async () => {
    const m = model({ count: 0 })
    const store = m.instance()
    const listener = vi.fn()

    store.subscribe(listener)
    store.proxy.count = 1

    await new Promise((r) => setTimeout(r))
    expect(listener).toHaveBeenCalled()
  })

  test('subscribe returns unsubscribe function that stops notifications', () => {
    const m = model({ count: 0 })
    const store = m.instance()
    const listener = vi.fn()

    const unsubscribe = store.subscribe(listener)
    unsubscribe()

    store.proxy.count = 5

    expect(listener).not.toHaveBeenCalled()
  })

  test('silent() sets isSilent flag during callback execution', () => {
    expect(isSilent()).toBe(false)

    let flagDuringCallback = false
    silent(() => {
      flagDuringCallback = isSilent()
    })

    expect(flagDuringCallback).toBe(true)
    expect(isSilent()).toBe(false)
  })

  test('silent() mutates proxy state without error', () => {
    const m = model({ count: 0 })
    const store = m.instance()

    silent(() => {
      store.proxy.count = 99
    })

    expect(store.getSnapshot().count).toBe(99)
  })

  test('multiple instance() calls produce independent stores', () => {
    const m = model({ count: 0 })
    const store1 = m.instance()
    const store2 = m.instance()

    store1.proxy.count = 10

    expect(store1.getSnapshot().count).toBe(10)
    expect(store2.getSnapshot().count).toBe(0)
  })

  test('nested object mutations trigger subscribe', async () => {
    const m = model({ user: { name: 'Alice', age: 30 } })
    const store = m.instance()
    const listener = vi.fn()

    store.subscribe(listener)
    store.proxy.user.name = 'Bob'

    await new Promise((r) => setTimeout(r))
    expect(listener).toHaveBeenCalled()
    expect(store.getSnapshot().user.name).toBe('Bob')
  })

  test('preserves Date objects in initial state', () => {
    const date = new Date('2024-01-15')
    const m = model({ createdAt: date })
    const store = m.instance()

    const snap = store.getSnapshot()
    expect(snap.createdAt).toBeInstanceOf(Date)
    expect(snap.createdAt.toISOString()).toBe(date.toISOString())
  })

  test('preserves nested Date objects in initial state', () => {
    const date = new Date('2024-06-01')
    const m = model({
      form: {
        name: 'test',
        launchedAt: date,
      },
    })
    const store = m.instance()

    const snap = store.getSnapshot()
    expect(snap.form.launchedAt).toBeInstanceOf(Date)
    expect(snap.form.launchedAt.toISOString()).toBe(date.toISOString())
  })

  test('snapshot() works on top-level model proxy', () => {
    const m = model({ count: 0, user: { name: 'Alice' } })
    const store = m.instance()

    store.proxy.count = 5
    const snap = snapshot(store.proxy)
    expect(snap.count).toBe(5)
    expect(snap.user.name).toBe('Alice')
    expect(() => {
      ;(snap as any).count = 99
    }).toThrow()
  })

  test('isProxy() returns true for the bound state used inside actions', () => {
    const m = model({
      count: 0,
      items: query({
        queryFn: async () => [],
        initialData: [] as string[],
      }),
    })
    const store = m.instance()
    const registry = createQueryBindingRegistry()
    const descriptors = m.pluginBags.get('query')! as ResourceDescriptorMap
    const bound = bindResourceState(store.proxy, descriptors, undefined, registry)

    expect(isProxy(bound)).toBe(true)
  })

  test('snapshot() works on the bound state (plugin-wrapped proxy)', () => {
    const m = model({
      count: 0,
      user: { name: 'Alice' },
      items: query({
        queryFn: async () => [],
        initialData: [] as string[],
      }),
    })
    const store = m.instance()
    const registry = createQueryBindingRegistry()
    const descriptors = m.pluginBags.get('query')! as ResourceDescriptorMap
    const bound = bindResourceState(store.proxy, descriptors, undefined, registry)

    bound.count = 7
    const snap = snapshot(bound)
    expect(snap.count).toBe(7)
    expect(snap.user.name).toBe('Alice')
    expect(() => {
      ;(snap as any).count = 99
    }).toThrow()
  })

  test('model with query descriptors extracts into pluginBags', () => {
    const m = model({
      name: 'test',
      items: query({
        queryFn: async () => [],
        initialData: [] as string[],
      }),
    })

    const queryBag = m.pluginBags.get('query')!
    expect(queryBag.size).toBe(1)
    expect(queryBag.has('items')).toBe(true)

    const store = m.instance()
    expect(store.getSnapshot().items).toEqual({
      data: [],
      isLoading: false,
      isFetching: false,
      isSuccess: false,
      isError: false,
      error: null,
    })
  })
})
