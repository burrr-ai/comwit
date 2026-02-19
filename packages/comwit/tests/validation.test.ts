import { model } from '../src/core/model'

describe('model() with rules (validation)', () => {
  test('$validation.errors shows null for passing rules', () => {
    const m = model(
      { name: 'Alice', age: 25 },
      {
        rules: {
          name: (v) => (v.length > 0 ? true : 'Name is required'),
          age: (v) => (v >= 18 ? true : 'Must be 18+'),
        },
      }
    )
    const store = m.instance()
    const snap = store.getSnapshot()

    expect(snap.$validation.errors.name).toBeNull()
    expect(snap.$validation.errors.age).toBeNull()
    expect(snap.$validation.isValid).toBe(true)
  })

  test('$validation.errors shows error message for failing rules', () => {
    const m = model(
      { name: '', age: 15 },
      {
        rules: {
          name: (v) => (v.length > 0 ? true : 'Name is required'),
          age: (v) => (v >= 18 ? true : 'Must be 18+'),
        },
      }
    )
    const store = m.instance()
    const snap = store.getSnapshot()

    expect(snap.$validation.errors.name).toBe('Name is required')
    expect(snap.$validation.errors.age).toBe('Must be 18+')
    expect(snap.$validation.isValid).toBe(false)
  })

  test('$validation.isValid is true when all pass, false when any fail', () => {
    const m = model(
      { name: 'Alice', age: 15 },
      {
        rules: {
          name: (v) => (v.length > 0 ? true : 'Name is required'),
          age: (v) => (v >= 18 ? true : 'Must be 18+'),
        },
      }
    )
    const store = m.instance()

    expect(store.getSnapshot().$validation.isValid).toBe(false)

    store.proxy.age = 20
    expect(store.getSnapshot().$validation.isValid).toBe(true)
  })

  test('validation updates when state changes', () => {
    const m = model(
      { email: '' },
      {
        rules: {
          email: (v) => (v.includes('@') ? true : 'Invalid email'),
        },
      }
    )
    const store = m.instance()

    expect(store.getSnapshot().$validation.errors.email).toBe('Invalid email')
    expect(store.getSnapshot().$validation.isValid).toBe(false)

    store.proxy.email = 'test@example.com'
    expect(store.getSnapshot().$validation.errors.email).toBeNull()
    expect(store.getSnapshot().$validation.isValid).toBe(true)
  })

  test('$validation accessible on proxy directly', () => {
    const m = model(
      { name: '' },
      {
        rules: {
          name: (v) => (v.length > 0 ? true : 'Required'),
        },
      }
    )
    const store = m.instance()

    const val = (store.proxy as any).$validation
    expect(val.isValid).toBe(false)
    expect(val.errors.name).toBe('Required')
  })

  test('$validation is read-only on proxy', () => {
    const m = model(
      { name: 'x' },
      {
        rules: {
          name: (v) => (v.length > 0 ? true : 'Required'),
        },
      }
    )
    const store = m.instance()

    expect(() => {
      ;(store.proxy as any).$validation = {}
    }).toThrow('Cannot set $validation')
  })

  test('works with derive together', () => {
    const m = model(
      { price: 0, qty: 1 },
      {
        derive: (state) => ({
          total: () => state.price * state.qty,
        }),
        rules: {
          price: (v) => (v > 0 ? true : 'Price must be positive'),
          qty: (v) => (v > 0 ? true : 'Qty must be positive'),
        },
      }
    )
    const store = m.instance()

    expect(store.getSnapshot().total).toBe(0)
    expect(store.getSnapshot().$validation.isValid).toBe(false)
    expect(store.getSnapshot().$validation.errors.price).toBe('Price must be positive')

    store.proxy.price = 10
    expect(store.getSnapshot().total).toBe(10)
    expect(store.getSnapshot().$validation.isValid).toBe(true)
  })

  test('snapshot with validation is frozen', () => {
    const m = model(
      { x: 1 },
      {
        rules: { x: () => true },
      }
    )
    const store = m.instance()
    const snap = store.getSnapshot()

    expect(Object.isFrozen(snap)).toBe(true)
  })
})
