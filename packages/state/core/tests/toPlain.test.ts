import { createProxy } from '../src/core/proxy'

describe('proxy.snapshot()', () => {
  test('returns a frozen snapshot of the proxy', () => {
    const state = createProxy({ count: 0, name: 'Alice' })
    const snap = state.snapshot()

    expect(snap).toEqual({ count: 0, name: 'Alice' })
    // snapshot is frozen (not extensible)
    expect(Object.isExtensible(snap)).toBe(false)
    // Should be a new object, not the proxy
    expect(snap).not.toBe(state)
  })

  test('deeply snapshots nested proxy objects', () => {
    const state = createProxy({
      user: { name: 'Alice', address: { city: 'NYC' } },
    })
    const snap = state.snapshot()

    expect(snap).toEqual({
      user: { name: 'Alice', address: { city: 'NYC' } },
    })
  })

  test('handles arrays in proxy state', () => {
    const state = createProxy({
      items: [
        { id: '1', text: 'hello' },
        { id: '2', text: 'world' },
      ],
    })
    const snap = state.snapshot()

    expect(snap.items).toEqual([
      { id: '1', text: 'hello' },
      { id: '2', text: 'world' },
    ])
    expect(Array.isArray(snap.items)).toBe(true)
  })

  test('preserves Date objects', () => {
    const date = new Date('2024-01-01')
    const state = createProxy({ createdAt: date })
    const snap = state.snapshot()

    expect(snap.createdAt).toBe(date)
  })

  test('result is JSON-serializable', () => {
    const state = createProxy({
      user: { name: 'Alice', age: 30 },
      items: [{ id: '1' }, { id: '2' }],
      active: true,
    })
    const snap = state.snapshot()

    expect(() => JSON.stringify(snap)).not.toThrow()
    expect(JSON.parse(JSON.stringify(snap))).toEqual({
      user: { name: 'Alice', age: 30 },
      items: [{ id: '1' }, { id: '2' }],
      active: true,
    })
  })

  test('reflects latest mutations', () => {
    const state = createProxy({ count: 0 })
    state.count = 42
    const snap = state.snapshot()

    expect(snap.count).toBe(42)
  })
})
