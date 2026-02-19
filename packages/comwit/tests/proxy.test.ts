import { createProxy, snapshot, subscribe } from '../src/core/proxy'

describe('createProxy()', () => {
  test('creates a reactive proxy object', () => {
    const state = createProxy({ count: 0 })

    expect(state).toBeDefined()
    expect(state.count).toBe(0)
  })

  test('deeply proxies nested objects', () => {
    const state = createProxy({ user: { name: 'Alice', address: { city: 'NYC' } } })

    expect(state.user.name).toBe('Alice')
    expect(state.user.address.city).toBe('NYC')
  })

  test('property mutations are tracked', async () => {
    const state = createProxy({ count: 0 })
    const listener = vi.fn()

    subscribe(state, listener)
    state.count = 1

    await Promise.resolve()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(state.count).toBe(1)
  })
})

describe('snapshot()', () => {
  test('returns a deep frozen immutable clone', () => {
    const state = createProxy({ count: 0 })
    const snap = snapshot(state)

    expect(Object.isFrozen(snap)).toBe(true)
    expect(() => {
      ;(snap as any).count = 99
    }).toThrow()
  })

  test('reflects latest mutations', () => {
    const state = createProxy({ count: 0 })
    state.count = 42

    const snap = snapshot(state)
    expect(snap.count).toBe(42)
  })

  test('deeply freezes nested objects', () => {
    const state = createProxy({ user: { name: 'Alice' } })
    const snap = snapshot(state)

    expect(Object.isFrozen(snap.user)).toBe(true)
    expect(() => {
      ;(snap as any).user.name = 'Bob'
    }).toThrow()
  })

  test('snapshot is independent from proxy (clone, not reference)', () => {
    const state = createProxy({ count: 0 })
    const snap1 = snapshot(state)

    state.count = 10
    const snap2 = snapshot(state)

    expect(snap1.count).toBe(0)
    expect(snap2.count).toBe(10)
  })
})

describe('subscribe()', () => {
  test('fires listener asynchronously after proxy mutation', async () => {
    const state = createProxy({ count: 0 })
    const listener = vi.fn()

    subscribe(state, listener)
    state.count = 1

    // listener should not have fired synchronously
    expect(listener).not.toHaveBeenCalled()

    await Promise.resolve()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  test('returns unsubscribe function that stops notifications', async () => {
    const state = createProxy({ count: 0 })
    const listener = vi.fn()

    const unsub = subscribe(state, listener)
    unsub()

    state.count = 5
    await Promise.resolve()

    expect(listener).not.toHaveBeenCalled()
  })

  test('multiple listeners all get notified', async () => {
    const state = createProxy({ count: 0 })
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    subscribe(state, listener1)
    subscribe(state, listener2)
    state.count = 1

    await Promise.resolve()
    expect(listener1).toHaveBeenCalledTimes(1)
    expect(listener2).toHaveBeenCalledTimes(1)
  })

  test('nested object mutations trigger notification', async () => {
    const state = createProxy({ user: { name: 'Alice' } })
    const listener = vi.fn()

    subscribe(state, listener)
    state.user.name = 'Bob'

    await Promise.resolve()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(state.user.name).toBe('Bob')
  })

  test('setting same value (Object.is) does NOT trigger notification', async () => {
    const state = createProxy({ count: 0 })
    const listener = vi.fn()

    subscribe(state, listener)
    state.count = 0

    await Promise.resolve()
    expect(listener).not.toHaveBeenCalled()
  })

  test('throws when called on a non-proxy object', () => {
    expect(() => {
      subscribe({} as any, () => {})
    }).toThrow('[comwit] subscribe() called on a non-proxy object')
  })

  test('multiple rapid mutations batch into single notification', async () => {
    const state = createProxy({ count: 0 })
    const listener = vi.fn()

    subscribe(state, listener)
    state.count = 1
    state.count = 2
    state.count = 3

    await Promise.resolve()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(state.count).toBe(3)
  })

  test('deleteProperty triggers notification', async () => {
    const state = createProxy<{ a?: number; b: number }>({ a: 1, b: 2 })
    const listener = vi.fn()

    subscribe(state, listener)
    delete state.a

    await Promise.resolve()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(state.a).toBeUndefined()
  })
})

describe('array values', () => {
  test('array values in proxy state work correctly', () => {
    const state = createProxy({ items: [1, 2, 3] })

    expect(state.items).toEqual([1, 2, 3])
    expect(state.items.length).toBe(3)
  })

  test('array mutations trigger notification', async () => {
    const state = createProxy({ items: ['a', 'b'] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items.push('c')

    await Promise.resolve()
    expect(listener).toHaveBeenCalled()
    expect(state.items).toEqual(['a', 'b', 'c'])
  })

  test('snapshot deeply freezes arrays', () => {
    const state = createProxy({ items: [1, 2, 3] })
    const snap = snapshot(state)

    expect(Object.isFrozen(snap.items)).toBe(true)
    expect(() => {
      ;(snap as any).items.push(4)
    }).toThrow()
  })
})

describe('new nested objects assigned to proxy', () => {
  test('new nested objects are also reactive', async () => {
    const state = createProxy<{ nested?: { value: number } }>({ nested: undefined })
    const listener = vi.fn()

    subscribe(state, listener)
    state.nested = { value: 1 }

    await Promise.resolve()
    listener.mockClear()

    state.nested!.value = 42

    await Promise.resolve()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(state.nested!.value).toBe(42)
  })

  test('deeply nested objects assigned later become reactive', async () => {
    const state = createProxy<{ a?: { b?: { c: number } } }>({})
    const listener = vi.fn()

    subscribe(state, listener)
    state.a = { b: { c: 1 } }

    await Promise.resolve()
    listener.mockClear()

    state.a!.b!.c = 99

    await Promise.resolve()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(state.a!.b!.c).toBe(99)
  })
})

describe('array mutation methods', () => {
  test('push triggers notification', async () => {
    const state = createProxy({ items: ['a'] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items.push('b')

    await Promise.resolve()
    expect(listener).toHaveBeenCalled()
    expect(state.items).toEqual(['a', 'b'])
  })

  test('splice removes and inserts correctly', async () => {
    const state = createProxy({ items: ['a', 'b', 'c', 'd'] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items.splice(1, 2, 'x')

    await Promise.resolve()
    expect(listener).toHaveBeenCalled()
    expect(state.items).toEqual(['a', 'x', 'd'])
  })

  test('pop triggers notification', async () => {
    const state = createProxy({ items: [1, 2, 3] })
    const listener = vi.fn()

    subscribe(state, listener)
    const popped = state.items.pop()

    await Promise.resolve()
    expect(listener).toHaveBeenCalled()
    expect(popped).toBe(3)
    expect(state.items).toEqual([1, 2])
  })

  test('shift triggers notification', async () => {
    const state = createProxy({ items: [1, 2, 3] })
    const listener = vi.fn()

    subscribe(state, listener)
    const shifted = state.items.shift()

    await Promise.resolve()
    expect(listener).toHaveBeenCalled()
    expect(shifted).toBe(1)
    expect(state.items).toEqual([2, 3])
  })

  test('unshift triggers notification', async () => {
    const state = createProxy({ items: [2, 3] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items.unshift(1)

    await Promise.resolve()
    expect(listener).toHaveBeenCalled()
    expect(state.items).toEqual([1, 2, 3])
  })

  test('sort triggers notification', async () => {
    const state = createProxy({ items: [3, 1, 2] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items.sort()

    await Promise.resolve()
    expect(listener).toHaveBeenCalled()
    expect(state.items).toEqual([1, 2, 3])
  })

  test('replacing array entirely triggers notification', async () => {
    const state = createProxy({ items: [1, 2] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items = [10, 20, 30]

    await Promise.resolve()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(state.items).toEqual([10, 20, 30])
  })

  test('new array assigned is also deeply proxied', async () => {
    const state = createProxy<{ items: { id: number }[] }>({ items: [] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items = [{ id: 1 }, { id: 2 }]

    await Promise.resolve()
    listener.mockClear()

    state.items[0].id = 99

    await Promise.resolve()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(state.items[0].id).toBe(99)
  })

  test('objects pushed into array become reactive', async () => {
    const state = createProxy<{ items: { name: string }[] }>({ items: [] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items.push({ name: 'Alice' })

    await Promise.resolve()
    listener.mockClear()

    state.items[0].name = 'Bob'

    await Promise.resolve()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(state.items[0].name).toBe('Bob')
  })

  test('snapshot freezes arrays with nested objects', () => {
    const state = createProxy({ items: [{ x: 1 }, { x: 2 }] })
    const snap = snapshot(state)

    expect(Object.isFrozen(snap.items)).toBe(true)
    expect(Object.isFrozen(snap.items[0])).toBe(true)
    expect(() => {
      ;(snap.items[0] as any).x = 99
    }).toThrow()
  })
})
