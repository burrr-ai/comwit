import { create, local, model, query } from '../src'

const domain = model({
  post: query<{ slug: string; title: string } | null, string>({
    initialData: null,
    queryFn: async (slug) => ({ slug, title: slug }),
  }),
  count: query<number>({
    initialData: 0,
    queryFn: async () => 1,
  }),
  plain: '',
})
const useDomain = create(domain, { actions: [] })

function queryHydrationContract() {
  const result: void = useDomain.hydrate({
    post: { arg: 'hello', data: { slug: 'hello', title: 'Hello' } },
    count: { data: 1 },
  })
  void result
  useDomain.hydrate(null)
  useDomain.hydrate(undefined)

  // @ts-expect-error argument queries require their inferred argument
  useDomain.hydrate({ post: { data: { slug: 'hello', title: 'Hello' } } })
  // @ts-expect-error hydration data is inferred from Query<TData, TArg>
  useDomain.hydrate({ post: { arg: 'hello', data: { slug: 1, title: 'Hello' } } })
  // @ts-expect-error no-argument queries do not accept an argument
  useDomain.hydrate({ count: { arg: 'unexpected', data: 1 } })
  // @ts-expect-error plain model fields cannot be hydrated
  useDomain.hydrate({ plain: { data: 'server' } })
  // @ts-expect-error unknown model fields cannot be hydrated
  useDomain.hydrate({ missing: { data: 1 } })
}

const source = local.collection<any>({ key: 'hydrate-type-local', version: 1 })
const localDomain = model({
  detail: local.query<{ id: string } | null, { id: string }>({
    source,
    initialData: null,
    queryFn: async ({ id }) => ({ id }),
  }),
})
const useLocalDomain = create(localDomain, { actions: [] })
const standaloneLocalDomain = model({
  draft: local<{ id: string } | null, string>({ source, initialData: null }),
})
const useStandaloneLocalDomain = create(standaloneLocalDomain, { actions: [] })

function localQueryHydrationContract() {
  useLocalDomain.hydrate({
    detail: { arg: { id: 'one' }, data: { id: 'one' } },
  })

  // @ts-expect-error local.query argument type is inferred
  useLocalDomain.hydrate({ detail: { arg: 'one', data: { id: 'one' } } })
  // @ts-expect-error local.query data type is inferred
  useLocalDomain.hydrate({ detail: { arg: { id: 'one' }, data: { slug: 'one' } } })
  // @ts-expect-error standalone local() remains restore-only and is not query hydration
  useStandaloneLocalDomain.hydrate({ draft: { arg: 'one', data: { id: 'one' } } })
}

void queryHydrationContract
void localQueryHydrationContract
