import { expectTypeOf, test } from 'vitest'
import { action, model, query, snapshot } from '../src'
import { createProxy } from '../src/core/proxy'

// `.snapshot()` is exposed on the top-level proxy at the type level. For
// nested slices, the runtime still intercepts `.snapshot()` (see proxy.ts
// `get` trap), but the recommended type-safe pattern is the standalone
// `snapshot()` helper — adding `.snapshot()` recursively would break plain
// assignments like `state.user = userFromApi`.

test('top-level proxy exposes .snapshot()', () => {
  const state = createProxy({ count: 0 })
  expectTypeOf(state.snapshot).toBeFunction()
  expectTypeOf(state.snapshot()).toEqualTypeOf<{ count: number }>()
})

test('standalone snapshot() works on nested object slices', () => {
  const state = createProxy({
    filter: { tags: [] as string[], keyword: '' },
  })

  // `state.filter` is typed as the plain shape — use the standalone helper.
  expectTypeOf(snapshot(state.filter)).toEqualTypeOf<{
    tags: string[]
    keyword: string
  }>()
})

test('standalone snapshot() works on array slices', () => {
  const state = createProxy({ tags: ['a', 'b'] })

  expectTypeOf(snapshot(state.tags)).toEqualTypeOf<string[]>()
})

test('array methods still accept the plain element type', () => {
  const state = createProxy({ items: [] as { id: string }[] })

  state.items.push({ id: 'x' })
  expectTypeOf(state.items[0]).toEqualTypeOf<{ id: string }>()
})

test('standalone snapshot() handles array elements', () => {
  const state = createProxy({ items: [{ id: 'x' }] })

  expectTypeOf(snapshot(state.items[0])).toEqualTypeOf<{ id: string }>()
})

// Plain values must remain assignable to state fields — adding `.snapshot()`
// at every nested level would break this.
test('plain values are assignable to nested state fields', () => {
  type User = { id: string; createdAt: Date; tags: string[] }
  const state = createProxy({
    user: { id: 'a', createdAt: new Date(), tags: [] as string[] } satisfies User,
  })

  state.user = { id: 'b', createdAt: new Date(), tags: ['x'] }
  state.user.tags = ['y', 'z']
  expectTypeOf(state.user.createdAt).toEqualTypeOf<Date>()
})

// Integration: the action `state()` accessor returns BoundResourceState<T>.
// `state.filter` is the plain shape; use standalone `snapshot()` to safely
// pass nested slices to RSC server actions.
test('action state() — standalone snapshot() converts nested slices', () => {
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
    expectTypeOf(snapshot(s.filter)).toEqualTypeOf<Filter>()
    expectTypeOf(snapshot(s.list.data.items)).toEqualTypeOf<{ id: string }[]>()
    return {}
  })
})
