import { expectTypeOf, test } from 'vitest'
import {
  action,
  create,
  local,
  model,
  query,
  snapshot,
  useModel,
  type SelectableResourceState,
} from '../src'
import type { Local, Query } from '../src'
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

test('history-enabled models expose $history methods', () => {
  const m = model({ count: 0 }, { history: true })

  action(({ state }) => {
    const s = state(m)
    expectTypeOf(s.$history.canUndo).toEqualTypeOf<boolean>()
    expectTypeOf(s.$history.undo).toBeFunction()
    expectTypeOf(s.$history.redo).toBeFunction()
    s.$history.undo()
    s.$history.redo()
    return {}
  })
})

test('selector load infers query arguments from the model', () => {
  type CatalogState = SelectableResourceState<{
    list: Query<string[], { page: number; filter?: string }>
    total: Query<number>
  }>

  expectTypeOf<CatalogState['list']['load']>().parameter(0).toEqualTypeOf<{
    page: number
    filter?: string
  }>()
  expectTypeOf<Parameters<CatalogState['list']['load']>>().toEqualTypeOf<
    [{ page: number; filter?: string }]
  >()
  expectTypeOf<Parameters<CatalogState['total']['load']>>().toEqualTypeOf<[]>()
  expectTypeOf<ReturnType<CatalogState['list']['load']>['data']>().toEqualTypeOf<string[]>()
})

const selectorModel = model({
  list: query<string[], { page: number }>({
    initialData: [],
    queryFn: ({ page }) => Promise.resolve([String(page)]),
  }),
  total: query<number>({ initialData: 0, queryFn: () => Promise.resolve(1) }),
})
const useSelectorModel = create(selectorModel, { actions: [] })

function selectorLoadTypeContract() {
  useModel(selectorModel, (state) => state.list.load({ page: 1 }).data)
  useSelectorModel((state) => state.total.load().data)

  // @ts-expect-error argument queries require their inferred argument
  useModel(selectorModel, (state) => state.list.load())
  // @ts-expect-error no-argument queries do not accept an argument
  useSelectorModel((state) => state.total.load({ page: 1 }))

  // `.load()` is collected only while a selector executes.
  // @ts-expect-error the selector-less result is passive
  useModel(selectorModel).list.load({ page: 1 })
  // @ts-expect-error the selector-less domain hook result is passive
  useSelectorModel().total.load()
}

void selectorLoadTypeContract

test('standalone local resources expose restore in selectors and exact set in actions', () => {
  type Product = { id: string; title: string }
  type DetailArg = { id: string }
  type DetailState = SelectableResourceState<{
    detail: Local<Product | null, DetailArg>
  }>

  expectTypeOf<DetailState['detail']['restore']>().parameter(0).toEqualTypeOf<DetailArg>()
  expectTypeOf<
    ReturnType<DetailState['detail']['restore']>['data']
  >().toEqualTypeOf<Product | null>()

  const products = local.collection<Product>({ key: 'products', version: 1 })
  const m = model({
    detail: local<Product | null, DetailArg>({
      source: products,
      initialData: null,
    }),
  })

  action(({ state }) => {
    const s = state(m)
    s.detail.set({ id: '1', title: 'Server' }, { arg: { id: '1' } })
    s.detail.remove({ id: '1' })
    return {}
  })

  function standaloneLocalTypeContract() {
    useModel(m, (state) => state.detail.restore({ id: '1' }).data)
  }

  void standaloneLocalTypeContract
})

test('local collections require getId only when the entity has no default id', () => {
  type ExternalProduct = { uuid: string; title: string }

  local.collection<ExternalProduct>({
    key: 'external-products',
    version: 1,
    getId: (product) => product.uuid,
  })

  // @ts-expect-error Entities without `id` must provide an identity extractor.
  local.collection<ExternalProduct>({ key: 'missing-get-id', version: 1 })

  local.collection<{ id: string; title: string }>({ key: 'default-id', version: 1 })
})
