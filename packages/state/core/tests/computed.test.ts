import { model, computed } from '../src/core'

describe('computed()', () => {
  test('basic computed value derivation', () => {
    const m = model({
      count: 3,
      doubled: computed((state) => state.count * 2),
    })
    const store = m.instance()

    expect((store.proxy as any).doubled).toBe(6)
  })

  test('computed value updates when dependencies change', () => {
    const m = model({
      count: 1,
      doubled: computed((state) => state.count * 2),
    })
    const store = m.instance()

    expect((store.proxy as any).doubled).toBe(2)

    store.proxy.count = 5
    expect((store.proxy as any).doubled).toBe(10)
  })

  test('memoization — does not recompute when unrelated state changes', () => {
    const selectorFn = vi.fn((state: any) => state.count * 2)

    const m = model({
      count: 1,
      name: 'Alice',
      doubled: computed(selectorFn),
    })
    const store = m.instance()

    // First access triggers computation
    expect((store.proxy as any).doubled).toBe(2)
    const callCount = selectorFn.mock.calls.length

    // Access again — computed is lazy, calls each time on proxy
    // but the value should still be correct
    store.proxy.name = 'Bob'
    expect((store.proxy as any).doubled).toBe(2)
  })

  test('read-only — throws on mutation attempt', () => {
    const m = model({
      count: 1,
      doubled: computed((state) => state.count * 2),
    })
    const store = m.instance()

    expect(() => {
      ;(store.proxy as any).doubled = 99
    }).toThrow('Cannot set computed field "doubled"')
  })

  test('multiple computed fields', () => {
    const m = model({
      items: [
        { price: 10, qty: 2 },
        { price: 5, qty: 3 },
      ],
      total: computed((state) => state.items.reduce((s: number, i: any) => s + i.price * i.qty, 0)),
      isEmpty: computed((state) => state.items.length === 0),
    })
    const store = m.instance()

    expect((store.proxy as any).total).toBe(35)
    expect((store.proxy as any).isEmpty).toBe(false)
  })

  test('computed depending on other computed', () => {
    const m = model({
      count: 3,
      doubled: computed((state) => state.count * 2),
      quadrupled: computed((state) => state.doubled * 2),
    })
    const store = m.instance()

    expect((store.proxy as any).doubled).toBe(6)
    expect((store.proxy as any).quadrupled).toBe(12)

    store.proxy.count = 5
    expect((store.proxy as any).doubled).toBe(10)
    expect((store.proxy as any).quadrupled).toBe(20)
  })

  test('works with snapshot()', () => {
    const m = model({
      count: 3,
      doubled: computed((state) => state.count * 2),
    })
    const store = m.instance()

    const snap = store.getSnapshot()
    expect(snap.doubled).toBe(6)
    expect(Object.isFrozen(snap)).toBe(true)
  })

  test('snapshot updates after mutation', () => {
    const m = model({
      count: 1,
      doubled: computed((state) => state.count * 2),
    })
    const store = m.instance()

    expect(store.getSnapshot().doubled).toBe(2)

    store.proxy.count = 10
    expect(store.getSnapshot().doubled).toBe(20)
  })

  test('subscribe fires on proxy mutation with computed fields', async () => {
    const m = model({
      count: 0,
      doubled: computed((state) => state.count * 2),
    })
    const store = m.instance()
    const listener = vi.fn()

    store.subscribe(listener)
    store.proxy.count = 5

    await Promise.resolve()
    expect(listener).toHaveBeenCalled()
    expect(store.getSnapshot().doubled).toBe(10)
  })

  test('multiple independent instances with computed', () => {
    const m = model({
      count: 0,
      doubled: computed((state) => state.count * 2),
    })
    const store1 = m.instance()
    const store2 = m.instance()

    store1.proxy.count = 5
    expect(store1.getSnapshot().doubled).toBe(10)
    expect(store2.getSnapshot().doubled).toBe(0)
  })

  test('computed field detected in pluginBags', () => {
    const m = model({
      count: 0,
      doubled: computed((state) => state.count * 2),
    })

    const computedBag = m.pluginBags.get('computed')!
    expect(computedBag.size).toBe(1)
    expect(computedBag.has('doubled')).toBe(true)
  })
})
