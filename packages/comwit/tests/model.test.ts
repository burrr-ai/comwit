import { model, silent, query } from '../src/core'
import { isSilent } from '../src/core/silent'

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

    await Promise.resolve()
    expect(listener).toHaveBeenCalled()
  })

  test('subscribe returns unsubscribe function that stops notifications', async () => {
    const m = model({ count: 0 })
    const store = m.instance()
    const listener = vi.fn()

    const unsubscribe = store.subscribe(listener)
    unsubscribe()

    store.proxy.count = 5
    await Promise.resolve()

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

    await Promise.resolve()
    expect(listener).toHaveBeenCalled()
    expect(store.getSnapshot().user.name).toBe('Bob')
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
