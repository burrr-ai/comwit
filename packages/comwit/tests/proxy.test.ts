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

  test('property mutations are tracked', () => {
    const state = createProxy({ count: 0 })
    const listener = vi.fn()

    subscribe(state, listener)
    state.count = 1

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
  test('fires listener synchronously after proxy mutation', () => {
    const state = createProxy({ count: 0 })
    const listener = vi.fn()

    subscribe(state, listener)
    state.count = 1

    expect(listener).toHaveBeenCalledTimes(1)
  })

  test('returns unsubscribe function that stops notifications', () => {
    const state = createProxy({ count: 0 })
    const listener = vi.fn()

    const unsub = subscribe(state, listener)
    unsub()

    state.count = 5

    expect(listener).not.toHaveBeenCalled()
  })

  test('multiple listeners all get notified', () => {
    const state = createProxy({ count: 0 })
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    subscribe(state, listener1)
    subscribe(state, listener2)
    state.count = 1

    expect(listener1).toHaveBeenCalledTimes(1)
    expect(listener2).toHaveBeenCalledTimes(1)
  })

  test('nested object mutations trigger notification', () => {
    const state = createProxy({ user: { name: 'Alice' } })
    const listener = vi.fn()

    subscribe(state, listener)
    state.user.name = 'Bob'

    expect(listener).toHaveBeenCalledTimes(1)
    expect(state.user.name).toBe('Bob')
  })

  test('setting same value (Object.is) does NOT trigger notification', () => {
    const state = createProxy({ count: 0 })
    const listener = vi.fn()

    subscribe(state, listener)
    state.count = 0

    expect(listener).not.toHaveBeenCalled()
  })

  test('throws when called on a non-proxy object', () => {
    expect(() => {
      subscribe({} as any, () => {})
    }).toThrow('[comwit] subscribe() called on a non-proxy object')
  })

  test('each mutation triggers a separate notification (synchronous)', () => {
    const state = createProxy({ count: 0 })
    const listener = vi.fn()

    subscribe(state, listener)
    state.count = 1
    state.count = 2
    state.count = 3

    expect(listener).toHaveBeenCalledTimes(3)
    expect(state.count).toBe(3)
  })

  test('deleteProperty triggers notification', () => {
    const state = createProxy<{ a?: number; b: number }>({ a: 1, b: 2 })
    const listener = vi.fn()

    subscribe(state, listener)
    delete state.a

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

  test('array mutations trigger notification', () => {
    const state = createProxy({ items: ['a', 'b'] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items.push('c')

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
  test('new nested objects are also reactive', () => {
    const state = createProxy<{ nested?: { value: number } }>({ nested: undefined })
    const listener = vi.fn()

    subscribe(state, listener)
    state.nested = { value: 1 }

    listener.mockClear()

    state.nested!.value = 42

    expect(listener).toHaveBeenCalledTimes(1)
    expect(state.nested!.value).toBe(42)
  })

  test('deeply nested objects assigned later become reactive', () => {
    const state = createProxy<{ a?: { b?: { c: number } } }>({})
    const listener = vi.fn()

    subscribe(state, listener)
    state.a = { b: { c: 1 } }

    listener.mockClear()

    state.a!.b!.c = 99

    expect(listener).toHaveBeenCalledTimes(1)
    expect(state.a!.b!.c).toBe(99)
  })
})

describe('non-proxyable objects (File, Blob, Date, Map, etc.)', () => {
  test('File stored in proxy state is not wrapped in Proxy', () => {
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
    const state = createProxy<{ file: File | null }>({ file: null })

    state.file = file

    expect(state.file).toBeInstanceOf(File)
    expect(state.file!.name).toBe('test.txt')
    expect(state.file!.size).toBe(5)
    // The stored File should be the exact same reference (not proxied)
    expect(state.file).toBe(file)
  })

  test('Blob stored in proxy state is not wrapped in Proxy', () => {
    const blob = new Blob(['data'], { type: 'application/octet-stream' })
    const state = createProxy<{ blob: Blob | null }>({ blob: null })

    state.blob = blob

    expect(state.blob).toBeInstanceOf(Blob)
    expect(state.blob!.size).toBe(4)
    expect(state.blob).toBe(blob)
  })

  test('File in nested object is preserved as-is', () => {
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
    const state = createProxy<{ form: { attachment: File | null } }>({
      form: { attachment: null },
    })

    state.form.attachment = file

    expect(state.form.attachment).toBe(file)
    expect(state.form.attachment.name).toBe('doc.pdf')
  })

  test('File inside array is preserved as-is', () => {
    const file1 = new File(['a'], 'a.txt', { type: 'text/plain' })
    const file2 = new File(['b'], 'b.txt', { type: 'text/plain' })
    const state = createProxy<{ files: File[] }>({ files: [] })

    state.files = [file1, file2]

    expect(state.files[0]).toBe(file1)
    expect(state.files[1]).toBe(file2)
  })

  test('Date stored in proxy state is not wrapped in Proxy', () => {
    const date = new Date('2024-01-01')
    const state = createProxy<{ date: Date | null }>({ date: null })

    state.date = date

    expect(state.date).toBeInstanceOf(Date)
    expect(state.date!.getFullYear()).toBe(2024)
    expect(state.date).toBe(date)
  })

  test('Map stored in proxy state is not wrapped in Proxy', () => {
    const map = new Map([['key', 'value']])
    const state = createProxy<{ map: Map<string, string> | null }>({ map: null })

    state.map = map

    expect(state.map).toBeInstanceOf(Map)
    expect(state.map!.get('key')).toBe('value')
    expect(state.map).toBe(map)
  })

  test('snapshot preserves non-proxyable objects by reference', () => {
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
    const state = createProxy<{ file: File | null }>({ file })

    const snap = snapshot(state)

    // snapshot's deepClone skips non-plain-objects, so File should be preserved
    expect(snap.file).toBeInstanceOf(File)
    expect(snap.file!.name).toBe('test.txt')
  })

  test('setting File triggers notification', () => {
    const state = createProxy<{ file: File | null }>({ file: null })
    const listener = vi.fn()

    subscribe(state, listener)
    state.file = new File(['hello'], 'test.txt', { type: 'text/plain' })

    expect(listener).toHaveBeenCalledTimes(1)
  })
})

describe('array mutation methods', () => {
  test('push triggers notification', () => {
    const state = createProxy({ items: ['a'] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items.push('b')

    expect(listener).toHaveBeenCalled()
    expect(state.items).toEqual(['a', 'b'])
  })

  test('splice removes and inserts correctly', () => {
    const state = createProxy({ items: ['a', 'b', 'c', 'd'] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items.splice(1, 2, 'x')

    expect(listener).toHaveBeenCalled()
    expect(state.items).toEqual(['a', 'x', 'd'])
  })

  test('pop triggers notification', () => {
    const state = createProxy({ items: [1, 2, 3] })
    const listener = vi.fn()

    subscribe(state, listener)
    const popped = state.items.pop()

    expect(listener).toHaveBeenCalled()
    expect(popped).toBe(3)
    expect(state.items).toEqual([1, 2])
  })

  test('shift triggers notification', () => {
    const state = createProxy({ items: [1, 2, 3] })
    const listener = vi.fn()

    subscribe(state, listener)
    const shifted = state.items.shift()

    expect(listener).toHaveBeenCalled()
    expect(shifted).toBe(1)
    expect(state.items).toEqual([2, 3])
  })

  test('unshift triggers notification', () => {
    const state = createProxy({ items: [2, 3] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items.unshift(1)

    expect(listener).toHaveBeenCalled()
    expect(state.items).toEqual([1, 2, 3])
  })

  test('sort triggers notification', () => {
    const state = createProxy({ items: [3, 1, 2] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items.sort()

    expect(listener).toHaveBeenCalled()
    expect(state.items).toEqual([1, 2, 3])
  })

  test('replacing array entirely triggers notification', () => {
    const state = createProxy({ items: [1, 2] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items = [10, 20, 30]

    expect(listener).toHaveBeenCalledTimes(1)
    expect(state.items).toEqual([10, 20, 30])
  })

  test('new array assigned is also deeply proxied', () => {
    const state = createProxy<{ items: { id: number }[] }>({ items: [] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items = [{ id: 1 }, { id: 2 }]

    listener.mockClear()

    state.items[0].id = 99

    expect(listener).toHaveBeenCalledTimes(1)
    expect(state.items[0].id).toBe(99)
  })

  test('objects pushed into array become reactive', () => {
    const state = createProxy<{ items: { name: string }[] }>({ items: [] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items.push({ name: 'Alice' })

    listener.mockClear()

    state.items[0].name = 'Bob'

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
