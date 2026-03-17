import { createProxy, toPlain } from '../src/core/proxy'

describe('toPlain()', () => {
  test('converts a proxy to a plain object', () => {
    const state = createProxy({ count: 0, name: 'Alice' })
    const plain = toPlain(state)

    expect(plain).toEqual({ count: 0, name: 'Alice' })
    expect(Object.isExtensible(plain)).toBe(true)
    // Should be a new object, not the proxy
    expect(plain).not.toBe(state)
  })

  test('deeply unwraps nested proxy objects', () => {
    const state = createProxy({
      user: { name: 'Alice', address: { city: 'NYC' } },
    })
    const plain = toPlain(state)

    expect(plain).toEqual({
      user: { name: 'Alice', address: { city: 'NYC' } },
    })
    // Nested objects should also be plain
    expect(Object.isExtensible(plain.user)).toBe(true)
    expect(Object.isExtensible(plain.user.address)).toBe(true)
  })

  test('handles arrays in proxy state', () => {
    const state = createProxy({
      items: [
        { id: '1', text: 'hello' },
        { id: '2', text: 'world' },
      ],
    })
    const plain = toPlain(state)

    expect(plain.items).toEqual([
      { id: '1', text: 'hello' },
      { id: '2', text: 'world' },
    ])
    expect(Array.isArray(plain.items)).toBe(true)
  })

  test('handles nested array element', () => {
    const state = createProxy({
      items: [{ id: '1', tags: ['a', 'b'] }],
    })
    const plain = toPlain(state.items[0])

    expect(plain).toEqual({ id: '1', tags: ['a', 'b'] })
  })

  test('passes through primitives', () => {
    expect(toPlain(42)).toBe(42)
    expect(toPlain('hello')).toBe('hello')
    expect(toPlain(true)).toBe(true)
    expect(toPlain(null)).toBe(null)
    expect(toPlain(undefined)).toBe(undefined)
  })

  test('works on plain objects (non-proxy)', () => {
    const obj = { a: 1, b: { c: 2 } }
    const plain = toPlain(obj)

    expect(plain).toEqual({ a: 1, b: { c: 2 } })
    expect(plain).not.toBe(obj)
  })

  test('preserves Date objects', () => {
    const date = new Date('2024-01-01')
    const state = createProxy({ createdAt: date })
    const plain = toPlain(state)

    expect(plain.createdAt).toBe(date)
  })

  test('result is JSON-serializable', () => {
    const state = createProxy({
      user: { name: 'Alice', age: 30 },
      items: [{ id: '1' }, { id: '2' }],
      active: true,
    })
    const plain = toPlain(state)

    expect(() => JSON.stringify(plain)).not.toThrow()
    expect(JSON.parse(JSON.stringify(plain))).toEqual({
      user: { name: 'Alice', age: 30 },
      items: [{ id: '1' }, { id: '2' }],
      active: true,
    })
  })

  test('reflects latest mutations', () => {
    const state = createProxy({ count: 0 })
    state.count = 42
    const plain = toPlain(state)

    expect(plain.count).toBe(42)
  })
})
