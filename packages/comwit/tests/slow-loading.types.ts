import {
  local,
  model,
  persist,
  query,
  create,
  type QueryDefaultOptions,
  type ComwitProviderProps,
} from '../src'
import type { BoundSingleResourceState, InfiniteResourceLoadResult } from '../src/core/query/types'

const source = local.collection<{ id: string }>({ key: 'typed', version: 1 })
const ordinary = query({ initialData: [], queryFn: () => [], slowLoadingMs: 500 })
const durable = local.query({ source, initialData: [], queryFn: () => [], slowLoadingMs: 500 })
const paged = local.infinite({
  source,
  initialData: [],
  queryFn: () => ({ data: [], cursor: null, hasMore: false }),
  slowLoadingMs: 500,
})
const live = query.realtime({
  initialData: [],
  queryFn: () => [],
  subscribe: () => () => {},
  slowLoadingMs: 500,
})
const useResource = create(model({ ordinary, durable, paged, live }), { actions: [] })

function readFlags() {
  const flags: boolean[] = useResource((s) => [
    s.ordinary.load().isSlowLoading,
    s.durable.load().isSlowLoading,
    s.paged.load().isSlowLoading,
    s.live.load().isSlowLoading,
  ])
  return flags
}

declare const bound: BoundSingleResourceState<string, string>
const value: boolean = bound.isSlowLoading
// @ts-expect-error the derived flag is library-owned
bound.isSlowLoading = true
// @ts-expect-error call overrides must not accept declaration-only policy
bound.query('id', { slowLoadingMs: 500 })
// @ts-expect-error query defaults cannot set the threshold
const defaults: QueryDefaultOptions = { slowLoadingMs: 500 }
const provider: ComwitProviderProps = {
  children: null,
  // @ts-expect-error provider query defaults cannot set the threshold
  defaultOptions: { query: { slowLoadingMs: 500 } },
}
// @ts-expect-error this is not a model option
model({ count: 0 }, { slowLoadingMs: 500 })
// @ts-expect-error standalone local has no loading policy
local({ source, initialData: [], slowLoadingMs: 500 })
const standalone = local({ source, initialData: [] })
// @ts-expect-error standalone local preserves its existing resource shape
standalone.isSlowLoading
// @ts-expect-error persist has no query loading policy
persist('value', { slowLoadingMs: 500 })

// Existing complete state results do not need to manufacture a new derived flag.
const result: InfiniteResourceLoadResult<string[]> = {
  data: [],
  cursor: null,
  hasMore: false,
  isLoading: false,
  isFetching: false,
  isSuccess: true,
  isError: false,
  error: null,
}
void [readFlags, value, defaults, provider, result]
