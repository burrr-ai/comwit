export const RESOURCE_BRAND = Symbol('comwit-resource')

export type AsyncResult<T> = T | Promise<T> | AsyncIterable<T>

export type ResourceKind = 'single' | 'infinite' | 'realtime'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

export type ResourceDataLike = Record<string, unknown>

type ResourceResultShape<
  TState extends ResourceDataLike,
  TData = TState extends { data: infer T } ? T : never,
> = TState | ({ data: TData } & Partial<Omit<TState, 'data'>>) | undefined

export type PlaceholderData<TData, TArg = void> =
  | TData
  | ((arg: TArg, previousData: TData) => TData)

export const RESOURCE_QUERY_OPTION_KEYS = new Set([
  'force',
  'placeholderData',
  'staleTime',
  'cacheTime',
  'gcTime',
])

export type QueryDefaultOptions = {
  staleTime?: number
  cacheTime?: number
  gcTime?: number
  placeholderData?: PlaceholderData<unknown, unknown>
}

type ResourceDefaultOptions = QueryDefaultOptions

export type QueryQueryOptions<TData, TArg> = QueryDefaultOptions & {
  placeholderData?: PlaceholderData<TData, TArg>
  force?: boolean
}

export type ResourceQueryOptions<TData, TArg> = QueryQueryOptions<TData, TArg>

export type ResourceContext<TState> = {
  state: Readonly<TState>
}

export type ResourceBaseState<TData> = {
  data: TData
  isLoading: boolean
  isFetching: boolean
  isSuccess: boolean
  isError: boolean
  error: string | null
}

export type ResourceSingleState<TData> = ResourceBaseState<TData>

export type ResourceInfiniteState<TData> = ResourceBaseState<TData> & {
  cursor: string | null
  hasMore: boolean
}

export type ResourceRealtimeState<TData> = ResourceBaseState<TData> & {
  connectionStatus: ConnectionStatus
  isConnected: boolean
}

export type SubscribeCallbacks<TData> = {
  update: (updater: (prev: TData) => TData) => void
  set: (data: TData) => void
  refetch: () => void
  onStatus: (status: ConnectionStatus) => void
  onError: (error: unknown) => void
}

export type ResourceResult<TData> = ResourceResultShape<ResourceBaseState<TData>, TData>

export type Query<TData, TArg = void> = SingleResourceDescriptor<TData, TArg>

export namespace Query {
  export type Single<TData, TArg = void> = Query<TData, TArg>
  export type Infinite<TData, TArg = void> = InfiniteResourceDescriptor<TData, TArg>
  export type Suspense<TData, TArg = void> = SingleResourceDescriptor<TData, TArg, true>
  export type SuspenseInfinite<TData, TArg = void> = InfiniteResourceDescriptor<TData, TArg, true>
  export type Realtime<TData, TArg = void> = RealtimeResourceDescriptor<TData, TArg>
}

export type QueryInfinite<TData, TArg = void> = InfiniteResourceDescriptor<TData, TArg>
export type QueryRealtime<TData, TArg = void> = RealtimeResourceDescriptor<TData, TArg>

export type SingleResourceLoadResult<TData> = TData | ResourceResult<TData>
export type InfiniteResourceLoadResult<TData> =
  | ResourceInfiniteState<TData>
  | ({ data: TData } & Partial<Omit<ResourceInfiniteState<TData>, 'data'>>)

export type BaseResourceDescriptor<TState extends ResourceDataLike, TArg, TResult> = {
  [RESOURCE_BRAND]: true
  kind: ResourceKind
  suspense?: boolean
  streamBatchInterval?: number
  initialState: TState
  options: Omit<
    ResourceQueryOptions<TState extends ResourceBaseState<infer TData> ? TData : never, unknown>,
    'force'
  >
  queryFn: (arg: TArg, context: ResourceContext<TState>) => AsyncResult<TResult>
  enabled?: (state: any) => boolean
  dependsOn?: (state: any) => any
  refetchInterval?:
    | number
    | false
    | ((
        data: TState extends ResourceBaseState<infer TData> ? TData : never,
        error?: Error
      ) => number | false)
}

export type SingleResourceDescriptor<
  TData,
  TArg = void,
  TSuspense extends boolean = false,
> = BaseResourceDescriptor<ResourceSingleState<TData>, TArg, SingleResourceLoadResult<TData>> &
  ResourceSingleState<TData> & {
    kind: 'single'
    __suspense?: TSuspense
  }

export type InfiniteResourceDescriptor<
  TData,
  TArg = void,
  TSuspense extends boolean = false,
> = BaseResourceDescriptor<ResourceInfiniteState<TData>, TArg, InfiniteResourceLoadResult<TData>> &
  ResourceInfiniteState<TData> & {
    kind: 'infinite'
    __suspense?: TSuspense
  }

export type RealtimeResourceDescriptor<TData, TArg = void> = BaseResourceDescriptor<
  ResourceRealtimeState<TData>,
  TArg,
  SingleResourceLoadResult<TData>
> &
  ResourceRealtimeState<TData> & {
    kind: 'realtime'
    subscribe: (callbacks: SubscribeCallbacks<TData>) => () => void
  }

export type AnyResourceDescriptor =
  | SingleResourceDescriptor<unknown, unknown>
  | InfiniteResourceDescriptor<unknown, unknown>
  | RealtimeResourceDescriptor<unknown, unknown>

export type ResourceDescriptorMap = Map<string, AnyResourceDescriptor>

interface ResourceSingleQueryController<TData, TArg> {
  query(arg: TArg, options?: ResourceQueryOptions<TData, TArg>): Promise<unknown>
  query(options?: ResourceQueryOptions<TData, TArg>): Promise<unknown>
  refetch(): Promise<unknown>
  set(next: unknown): unknown
}

interface ResourceInfiniteQueryController<TData, TArg> extends ResourceSingleQueryController<
  TData,
  TArg
> {
  nextFetch(arg?: TArg): Promise<unknown>
  previousFetch(arg: TArg, options?: ResourceQueryOptions<TData, TArg>): Promise<unknown>
  previousFetch(options?: ResourceQueryOptions<TData, TArg>): Promise<unknown>
}

interface ResourceRealtimeQueryController<TData, TArg> extends ResourceSingleQueryController<
  TData,
  TArg
> {
  unsubscribe(): void
}

export type BoundSingleResourceState<TData, TArg = unknown> = ResourceSingleState<TData> &
  ResourceSingleQueryController<TData, TArg>
export type BoundInfiniteResourceState<TData, TArg = unknown> = ResourceInfiniteState<TData> &
  ResourceInfiniteQueryController<TData, TArg>
export type BoundRealtimeResourceState<TData, TArg = unknown> = ResourceRealtimeState<TData> &
  ResourceRealtimeQueryController<TData, TArg>

type SuspenseSingleResourceState<TData, TArg = unknown> = Omit<
  BoundSingleResourceState<TData, TArg>,
  'data'
> & { data: NonNullable<TData> }
type SuspenseInfiniteResourceState<TData, TArg = unknown> = Omit<
  BoundInfiniteResourceState<TData, TArg>,
  'data'
> & { data: NonNullable<TData> }

/**
 * Built-in object types that the runtime proxy refuses to wrap. Mirrors the
 * exclusion list in `Snapshotable<T>` to keep plain `Date`/`Map`/etc.
 * assignable inside actions.
 */
type BoundBuiltInObject =
  | Date
  | RegExp
  | Error
  | Promise<unknown>
  | Map<unknown, unknown>
  | Set<unknown>
  | WeakMap<object, unknown>
  | WeakSet<object>
  | ArrayBuffer
  | DataView

/**
 * Recursively projects a model's state shape into the proxy-bound runtime
 * shape. Plain objects and arrays additionally expose a `.snapshot()` method
 * that returns the un-decorated shape (see `Snapshotable` for details).
 *
 * Array element types are intentionally not recursed into so that mutating
 * methods (`push`, `[i] =`, etc.) keep accepting the plain element type.
 */
export type BoundResourceState<T> =
  T extends RealtimeResourceDescriptor<infer TData, infer TArg>
    ? BoundRealtimeResourceState<TData, TArg>
    : T extends InfiniteResourceDescriptor<infer TData, infer TArg, infer TSuspense>
      ? TSuspense extends true
        ? SuspenseInfiniteResourceState<TData, TArg>
        : BoundInfiniteResourceState<TData, TArg>
      : T extends SingleResourceDescriptor<infer TData, infer TArg, infer TSuspense>
        ? TSuspense extends true
          ? SuspenseSingleResourceState<TData, TArg>
          : BoundSingleResourceState<TData, TArg>
        : T extends ResourceRealtimeState<infer TData>
          ? BoundRealtimeResourceState<TData, unknown>
          : T extends ResourceInfiniteState<infer TData>
            ? BoundInfiniteResourceState<TData, unknown>
            : T extends ResourceSingleState<infer TData>
              ? BoundSingleResourceState<TData, unknown>
              : T extends (...args: any[]) => any
                ? T
                : T extends BoundBuiltInObject
                  ? T
                  : T extends ReadonlyArray<unknown>
                    ? T & { snapshot(): T }
                    : T extends object
                      ? { [K in keyof T]: BoundResourceState<T[K]> } & { snapshot(): T }
                      : T

export type DependentQueryOptions<TData> = {
  enabled?: (state: any) => boolean
  dependsOn?: (state: any) => any
  refetchInterval?: number | false | ((data: TData, error?: Error) => number | false)
}

export type SingleResourceBuilderOptions<TData, TArg = void> = {
  initialData: TData
  suspense?: boolean
  streamBatchInterval?: number
  queryFn: (
    arg: TArg,
    context: ResourceContext<ResourceSingleState<TData>>
  ) => AsyncResult<SingleResourceLoadResult<TData>>
} & Omit<ResourceQueryOptions<TData, TArg>, 'force'> &
  DependentQueryOptions<TData>

export type InfiniteResourceBuilderOptions<TData, TArg = void> = {
  initialData: TData
  suspense?: boolean
  streamBatchInterval?: number
  queryFn: (
    arg: TArg,
    context: ResourceContext<ResourceInfiniteState<TData>>
  ) => AsyncResult<InfiniteResourceLoadResult<TData>>
} & Omit<ResourceQueryOptions<TData, TArg>, 'force'> &
  DependentQueryOptions<TData>

export type RealtimeResourceBuilderOptions<TData, TArg = void> = {
  initialData: TData
  queryFn: (
    arg: TArg,
    context: ResourceContext<ResourceRealtimeState<TData>>
  ) => AsyncResult<SingleResourceLoadResult<TData>>
  subscribe: (callbacks: SubscribeCallbacks<TData>) => () => void
} & Omit<ResourceQueryOptions<TData, TArg>, 'force'>

export type ResourceFactory = {
  <TData, TArg = void>(
    opts: SingleResourceBuilderOptions<TData, TArg> & { suspense: true }
  ): SingleResourceDescriptor<TData, TArg, true>
  <TData, TArg = void>(
    opts: SingleResourceBuilderOptions<TData, TArg>
  ): SingleResourceDescriptor<TData, TArg>
  infinite: {
    <TData, TArg = void>(
      opts: InfiniteResourceBuilderOptions<TData, TArg> & { suspense: true }
    ): InfiniteResourceDescriptor<TData, TArg, true>
    <TData, TArg = void>(
      opts: InfiniteResourceBuilderOptions<TData, TArg>
    ): InfiniteResourceDescriptor<TData, TArg>
  }
  realtime: <TData, TArg = void>(
    opts: RealtimeResourceBuilderOptions<TData, TArg>
  ) => RealtimeResourceDescriptor<TData, TArg>
}

export type QueryMode = 'replace' | 'append' | 'restore'

export type QueryCacheKey = string

export type QueryCacheEntry = {
  key: QueryCacheKey
  arg: unknown
  hasQueried: boolean
  lastFetchedAt: number
  lastResult?: unknown
  cursorHistory: Array<string | null>
  gcTime?: number
  state: ResourceDataLike
}

export type SuspenseState = {
  promise: Promise<unknown> | null
  error: Error | null
}

export type QueryBindingRegistry = {
  boundResourceValue: WeakMap<object, Record<string, unknown>>
  boundPathProxy: WeakMap<object, Map<string, object>>
  boundResourceRuntime: WeakMap<object, ResourceRuntimeState>
  suspense: Map<string, SuspenseState>
}

export type ResourceRuntimeState = {
  path: string
  lastArg?: unknown
  activeKey?: QueryCacheKey
  fetchId: number
  cacheEntries: Map<QueryCacheKey, QueryCacheEntry>
  subscriptionCleanup?: () => void
  refetchIntervalId?: ReturnType<typeof setInterval>
  streamAbortController?: AbortController
}
