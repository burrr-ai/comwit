import { expectTypeOf, test } from 'vitest'
import { action, model, query, snapshot } from '../src'
import { createProxy } from '../src/core/proxy'

// Pure type-level tests: nested proxies should expose `.snapshot()` so callers
// can convert sub-trees to plain objects without casting (the runtime already
// supports this via the proxy `get` trap).

test('top-level proxy exposes .snapshot()', () => {
  const state = createProxy({ count: 0 })
  expectTypeOf(state.snapshot).toBeFunction()
  expectTypeOf(state.snapshot()).toEqualTypeOf<{ count: number }>()
})

test('nested object proxies expose .snapshot()', () => {
  const state = createProxy({
    filter: { tags: [] as string[], keyword: '' },
  })

  expectTypeOf(state.filter.snapshot).toBeFunction()
  expectTypeOf(state.filter.snapshot()).toEqualTypeOf<{
    tags: string[]
    keyword: string
  }>()
})

test('array proxies expose .snapshot()', () => {
  const state = createProxy({ tags: ['a', 'b'] })

  expectTypeOf(state.tags.snapshot).toBeFunction()
  expectTypeOf(state.tags.snapshot()).toEqualTypeOf<string[]>()
})

test('array methods still accept the plain element type', () => {
  const state = createProxy({ items: [] as { id: string }[] })

  // No cast needed — element type is not transformed
  state.items.push({ id: 'x' })
  expectTypeOf(state.items[0]).toEqualTypeOf<{ id: string }>()
})

test('standalone snapshot() handles array elements', () => {
  const state = createProxy({ items: [{ id: 'x' }] })

  // Use the standalone helper for array elements (no `.snapshot()` on items)
  expectTypeOf(snapshot(state.items[0])).toEqualTypeOf<{ id: string }>()
})

test('functions are not decorated', () => {
  const state = createProxy({ fn: (x: number) => x + 1 })
  expectTypeOf(state.fn).toEqualTypeOf<(x: number) => number>()
})

// Integration: the action `state()` accessor returns BoundResourceState<T>,
// which must also expose `.snapshot()` on nested objects so callers can pass
// state slices to RSC server actions without manual cloning.
test('action state() exposes .snapshot() on nested objects', () => {
  type Filter = { tags: string[]; keyword: string }
  type Pageable<T> = { items: T[]; total: number }

  const m = model({
    list: query<Pageable<{ id: string }>, { filter: Filter }>({
      initialData: { items: [], total: 0 },
      queryFn: async () => ({ items: [], total: 0 }),
    }),
    filter: { tags: [] as string[], keyword: '' } satisfies Filter,
  })

  action(({ state }) => {
    const s = state(m)
    expectTypeOf(s.filter.snapshot()).toEqualTypeOf<Filter>()
    expectTypeOf(s.list.data.items.snapshot()).toEqualTypeOf<{ id: string }[]>()
    return {}
  })
})
