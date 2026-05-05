import { createProxy, snapshot, subscribe, isProxy } from '../src/core/proxy'

const flush = () => new Promise((r) => setTimeout(r))

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

    await flush()
    expect(listener).toHaveBeenCalled()
    expect(state.count).toBe(1)
  })
})

describe('snapshot()', () => {
  test('returns an immutable snapshot', () => {
    const state = createProxy({ count: 0 })
    const snap = snapshot(state)

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

  test('deeply immutable nested objects', () => {
    const state = createProxy({ user: { name: 'Alice' } })
    const snap = snapshot(state)

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

describe('isProxy()', () => {
  test('returns true for top-level proxy', () => {
    const state = createProxy({ count: 0 })
    expect(isProxy(state)).toBe(true)
  })

  test('returns true for nested proxy slice', () => {
    const state = createProxy({ user: { name: 'Alice' } })
    expect(isProxy(state.user)).toBe(true)
  })

  test('returns true for nested array proxy', () => {
    const state = createProxy({ items: [{ id: 1 }] })
    expect(isProxy(state.items)).toBe(true)
    expect(isProxy(state.items[0])).toBe(true)
  })

  test('returns false for plain objects', () => {
    expect(isProxy({})).toBe(false)
    expect(isProxy({ count: 0 })).toBe(false)
    expect(isProxy([1, 2, 3])).toBe(false)
  })

  test('returns false for primitives and nullish values', () => {
    expect(isProxy(null)).toBe(false)
    expect(isProxy(undefined)).toBe(false)
    expect(isProxy(0)).toBe(false)
    expect(isProxy('a')).toBe(false)
    expect(isProxy(true)).toBe(false)
  })

  test('returns false for snapshot result', () => {
    const state = createProxy({ count: 0 })
    const snap = snapshot(state)
    expect(isProxy(snap)).toBe(false)
  })

  test('returns false for non-proxyable objects (Date, File, Map)', () => {
    expect(isProxy(new Date())).toBe(false)
    expect(isProxy(new Map())).toBe(false)
  })
})

describe('subscribe()', () => {
  test('fires listener after proxy mutation', async () => {
    const state = createProxy({ count: 0 })
    const listener = vi.fn()

    subscribe(state, listener)
    state.count = 1

    await flush()
    expect(listener).toHaveBeenCalled()
  })

  test('returns unsubscribe function that stops notifications', async () => {
    const state = createProxy({ count: 0 })
    const listener = vi.fn()

    const unsub = subscribe(state, listener)
    unsub()

    state.count = 5
    await flush()

    expect(listener).not.toHaveBeenCalled()
  })

  test('multiple listeners all get notified', async () => {
    const state = createProxy({ count: 0 })
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    subscribe(state, listener1)
    subscribe(state, listener2)
    state.count = 1

    await flush()
    expect(listener1).toHaveBeenCalled()
    expect(listener2).toHaveBeenCalled()
  })

  test('nested object mutations trigger notification', async () => {
    const state = createProxy({ user: { name: 'Alice' } })
    const listener = vi.fn()

    subscribe(state, listener)
    state.user.name = 'Bob'

    await flush()
    expect(listener).toHaveBeenCalled()
    expect(state.user.name).toBe('Bob')
  })

  test('setting same value (Object.is) does NOT trigger notification', async () => {
    const state = createProxy({ count: 0 })
    const listener = vi.fn()

    subscribe(state, listener)
    state.count = 0

    await flush()
    expect(listener).not.toHaveBeenCalled()
  })

  test('throws when called on a non-proxy object', () => {
    expect(() => {
      subscribe({} as any, () => {})
    }).toThrow()
  })

  test('each synchronous mutation fires a notification', () => {
    const state = createProxy({ count: 0 })
    const listener = vi.fn()

    subscribe(state, listener)
    state.count = 1
    state.count = 2
    state.count = 3

    expect(listener).toHaveBeenCalledTimes(3)
    expect(state.count).toBe(3)
  })

  test('deleteProperty triggers notification', async () => {
    const state = createProxy<{ a?: number; b: number }>({ a: 1, b: 2 })
    const listener = vi.fn()

    subscribe(state, listener)
    delete state.a

    await flush()
    expect(listener).toHaveBeenCalled()
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

    await flush()
    expect(listener).toHaveBeenCalled()
    expect(state.items).toEqual(['a', 'b', 'c'])
  })

  test('snapshot returns immutable arrays', () => {
    const state = createProxy({ items: [1, 2, 3] })
    const snap = snapshot(state)

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

    await flush()
    listener.mockClear()

    state.nested!.value = 42

    await flush()
    expect(listener).toHaveBeenCalled()
    expect(state.nested!.value).toBe(42)
  })

  test('deeply nested objects assigned later become reactive', async () => {
    const state = createProxy<{ a?: { b?: { c: number } } }>({})
    const listener = vi.fn()

    subscribe(state, listener)
    state.a = { b: { c: 1 } }

    await flush()
    listener.mockClear()

    state.a!.b!.c = 99

    await flush()
    expect(listener).toHaveBeenCalled()
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

  test('File in initial state is preserved', () => {
    const file = new File(['hello'], 'init.txt', { type: 'text/plain' })
    const state = createProxy<{ file: File }>({ file })

    expect(state.file).toBe(file)
    expect(state.file.name).toBe('init.txt')
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
    const date = new Date('2024-01-01')
    const state = createProxy<{ date: Date }>({ date })

    const snap = snapshot(state)

    expect(snap.date).toBeInstanceOf(Date)
    expect(snap.date.getFullYear()).toBe(2024)
  })

  test('setting non-proxyable object triggers notification', async () => {
    const state = createProxy<{ date: Date | null }>({ date: null })
    const listener = vi.fn()

    subscribe(state, listener)
    state.date = new Date('2024-01-01')

    await flush()
    expect(listener).toHaveBeenCalled()
  })
})

describe('array mutation methods', () => {
  test('push triggers notification', async () => {
    const state = createProxy({ items: ['a'] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items.push('b')

    await flush()
    expect(listener).toHaveBeenCalled()
    expect(state.items).toEqual(['a', 'b'])
  })

  test('splice removes and inserts correctly', async () => {
    const state = createProxy({ items: ['a', 'b', 'c', 'd'] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items.splice(1, 2, 'x')

    await flush()
    expect(listener).toHaveBeenCalled()
    expect(state.items).toEqual(['a', 'x', 'd'])
  })

  test('pop triggers notification', async () => {
    const state = createProxy({ items: [1, 2, 3] })
    const listener = vi.fn()

    subscribe(state, listener)
    const popped = state.items.pop()

    await flush()
    expect(listener).toHaveBeenCalled()
    expect(popped).toBe(3)
    expect(state.items).toEqual([1, 2])
  })

  test('shift triggers notification', async () => {
    const state = createProxy({ items: [1, 2, 3] })
    const listener = vi.fn()

    subscribe(state, listener)
    const shifted = state.items.shift()

    await flush()
    expect(listener).toHaveBeenCalled()
    expect(shifted).toBe(1)
    expect(state.items).toEqual([2, 3])
  })

  test('unshift triggers notification', async () => {
    const state = createProxy({ items: [2, 3] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items.unshift(1)

    await flush()
    expect(listener).toHaveBeenCalled()
    expect(state.items).toEqual([1, 2, 3])
  })

  test('sort triggers notification', async () => {
    const state = createProxy({ items: [3, 1, 2] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items.sort()

    await flush()
    expect(listener).toHaveBeenCalled()
    expect(state.items).toEqual([1, 2, 3])
  })

  test('replacing array entirely triggers notification', async () => {
    const state = createProxy({ items: [1, 2] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items = [10, 20, 30]

    await flush()
    expect(listener).toHaveBeenCalled()
    expect(state.items).toEqual([10, 20, 30])
  })

  test('new array assigned is also deeply proxied', async () => {
    const state = createProxy<{ items: { id: number }[] }>({ items: [] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items = [{ id: 1 }, { id: 2 }]

    await flush()
    listener.mockClear()

    state.items[0].id = 99

    await flush()
    expect(listener).toHaveBeenCalled()
    expect(state.items[0].id).toBe(99)
  })

  test('objects pushed into array become reactive', async () => {
    const state = createProxy<{ items: { name: string }[] }>({ items: [] })
    const listener = vi.fn()

    subscribe(state, listener)
    state.items.push({ name: 'Alice' })

    await flush()
    listener.mockClear()

    state.items[0].name = 'Bob'

    await flush()
    expect(listener).toHaveBeenCalled()
    expect(state.items[0].name).toBe('Bob')
  })

  test('snapshot returns immutable arrays with nested objects', () => {
    const state = createProxy({ items: [{ x: 1 }, { x: 2 }] })
    const snap = snapshot(state)

    expect(() => {
      ;(snap.items[0] as any).x = 99
    }).toThrow()
  })
})
