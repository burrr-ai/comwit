import { model } from '../src/core/model'

describe('model() with derive', () => {
  test('basic derived value computes correctly', () => {
    const m = model(
      {
        items: [
          { price: 10, qty: 2 },
          { price: 5, qty: 3 },
        ],
      },
      {
        derive: (state) => ({
          total: () => state.items.reduce((s, i) => s + i.price * i.qty, 0),
        }),
      }
    )
    const store = m.instance()
    const snap = store.getSnapshot()

    expect(snap.total).toBe(35)
  })

  test('derived value updates when dependency changes', () => {
    const m = model(
      { items: [{ price: 10, qty: 1 }] },
      {
        derive: (state) => ({
          total: () => state.items.reduce((s, i) => s + i.price * i.qty, 0),
        }),
      }
    )
    const store = m.instance()

    expect(store.getSnapshot().total).toBe(10)

    store.proxy.items[0].qty = 5
    expect(store.getSnapshot().total).toBe(50)
  })

  test('multiple derived values', () => {
    const m = model(
      { items: [] as { price: number; qty: number }[] },
      {
        derive: (state) => ({
          total: () => state.items.reduce((s, i) => s + i.price * i.qty, 0),
          isEmpty: () => state.items.length === 0,
        }),
      }
    )
    const store = m.instance()

    expect(store.getSnapshot().total).toBe(0)
    expect(store.getSnapshot().isEmpty).toBe(true)

    store.proxy.items.push({ price: 10, qty: 2 })
    expect(store.getSnapshot().total).toBe(20)
    expect(store.getSnapshot().isEmpty).toBe(false)
  })

  test('derived field is read-only on proxy (throws on set)', () => {
    const m = model(
      { count: 0 },
      {
        derive: (state) => ({
          doubled: () => state.count * 2,
        }),
      }
    )
    const store = m.instance()

    expect(() => {
      ;(store.proxy as any).doubled = 99
    }).toThrow('Cannot set derived field "doubled"')
  })

  test('derived value accessible on proxy directly', () => {
    const m = model(
      { count: 3 },
      {
        derive: (state) => ({
          doubled: () => state.count * 2,
        }),
      }
    )
    const store = m.instance()

    expect((store.proxy as any).doubled).toBe(6)

    store.proxy.count = 10
    expect((store.proxy as any).doubled).toBe(20)
  })

  test('snapshot includes derived values and is frozen', () => {
    const m = model(
      { x: 1 },
      {
        derive: (state) => ({
          y: () => state.x + 1,
        }),
      }
    )
    const store = m.instance()
    const snap = store.getSnapshot()

    expect(snap.y).toBe(2)
    expect(Object.isFrozen(snap)).toBe(true)
  })

  test('subscribe still fires on proxy mutation with derive', async () => {
    const m = model(
      { count: 0 },
      {
        derive: (state) => ({
          doubled: () => state.count * 2,
        }),
      }
    )
    const store = m.instance()
    const listener = vi.fn()

    store.subscribe(listener)
    store.proxy.count = 5

    await new Promise((r) => setTimeout(r))
    expect(listener).toHaveBeenCalled()
    expect(store.getSnapshot().doubled).toBe(10)
  })

  test('multiple independent instances with derive', () => {
    const m = model(
      { count: 0 },
      {
        derive: (state) => ({
          doubled: () => state.count * 2,
        }),
      }
    )
    const store1 = m.instance()
    const store2 = m.instance()

    store1.proxy.count = 5
    expect(store1.getSnapshot().doubled).toBe(10)
    expect(store2.getSnapshot().doubled).toBe(0)
  })
})
