export const RESOURCE_BRAND = Symbol('comwit-resource')
export const RESOURCE_LIFECYCLE = Symbol('comwit-resource-lifecycle')
export const RESOURCE_TYPE_OVERRIDE = Symbol('comwit-resource-type-override')
export const RESOURCE_SUSPEND_PREPARE = Symbol('comwit-resource-suspend-prepare')
export const RESOURCE_SUSPEND_COMMIT = Symbol('comwit-resource-suspend-commit')
export const RESOURCE_HYDRATE = Symbol('comwit-resource-hydrate')

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
  'gcTime',
])

export type QueryDefaultOptions = {
  staleTime?: number
  gcTime?: number
  placeholderData?: PlaceholderData<unknown, unknown>
}

type ResourceDefaultOptions = QueryDefaultOptions

export type QueryQueryOptions<TData, TArg> = QueryDefaultOptions & {
  placeholderData?: PlaceholderData<TData, TArg>
  force?: boolean
}

export type ResourceSetOptions<TArg> = [TArg] extends [void] ? { arg?: TArg } : { arg: TArg }

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
  /** @deprecated Use the selector-level `.suspend(arg)` method instead. */
  export type Suspense<TData, TArg = void> = SingleResourceDescriptor<TData, TArg, true>
  /** @deprecated Use the selector-level `.suspend(arg)` method instead. */
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
  /** @deprecated Use the selector-level `.suspend(arg)` method instead. */
  suspense?: boolean
  streamBatchInterval?: number
  initialState: TState
  options: Omit<
    ResourceQueryOptions<TState extends ResourceBaseState<infer TData> ? TData : never, unknown>,
    'force'
  >
  queryFn: (arg: TArg, context: ResourceContext<TState>) => AsyncResult<TResult>
  /** Optional stable cache-key serializer used by resource adapters. */
  serializeArg?: (arg: TArg) => string
  /** Selector method name. Ordinary queries expose `load`; adapters may override it. */
  selectorMethod?: string
  /** Provider-bound lifecycle adapters. Query itself does not know their implementation. */
  [RESOURCE_LIFECYCLE]?: ResourceLifecycleFactory[]
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
  set(next: unknown, options?: ResourceSetOptions<TArg>): unknown
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

type ResourceLoadController<TState, TArg> = [TArg] extends [void]
  ? { load(): TState }
  : { load(arg: TArg): TState }

type ResourceSuspendController<TState, TArg> = [TArg] extends [void]
  ? {
      /** @experimental Render-time query execution is not compatible with every SSR transport. */
      suspend(): TState
    }
  : {
      /** @experimental Render-time query execution is not compatible with every SSR transport. */
      suspend(arg: TArg): TState
    }

export type SelectableSingleResourceState<TData, TArg = void> = ResourceSingleState<TData> &
  ResourceLoadController<ResourceSingleState<TData>, TArg> &
  ResourceSuspendController<ResourceSingleState<TData>, TArg>
export type SelectableInfiniteResourceState<TData, TArg = void> = ResourceInfiniteState<TData> &
  ResourceLoadController<ResourceInfiniteState<TData>, TArg> &
  ResourceSuspendController<ResourceInfiniteState<TData>, TArg>
export type SelectableRealtimeResourceState<TData, TArg = void> = ResourceRealtimeState<TData> &
  ResourceLoadController<ResourceRealtimeState<TData>, TArg>

type SuspenseSelectableSingleResourceState<TData, TArg = void> = Omit<
  SelectableSingleResourceState<TData, TArg>,
  'data' | 'load'
> & {
  data: NonNullable<TData>
  load: ResourceLoadController<
    Omit<ResourceSingleState<TData>, 'data'> & { data: NonNullable<TData> },
    TArg
  >['load']
}
type SuspenseSelectableInfiniteResourceState<TData, TArg = void> = Omit<
  SelectableInfiniteResourceState<TData, TArg>,
  'data' | 'load'
> & {
  data: NonNullable<TData>
  load: ResourceLoadController<
    Omit<ResourceInfiniteState<TData>, 'data'> & { data: NonNullable<TData> },
    TArg
  >['load']
}

type SuspenseSingleResourceState<TData, TArg = unknown> = Omit<
  BoundSingleResourceState<TData, TArg>,
  'data'
> & { data: NonNullable<TData> }
type SuspenseInfiniteResourceState<TData, TArg = unknown> = Omit<
  BoundInfiniteResourceState<TData, TArg>,
  'data'
> & { data: NonNullable<TData> }

/**
 * Recursively projects a model's state shape into the proxy-bound runtime
 * shape. Resource descriptors are replaced with their bound query controllers;
 * everything else passes through.
 *
 * `.snapshot()` is intentionally NOT injected at every nested level — adding
 * it via intersection (`T & { snapshot(): T }`) would make plain values
 * un-assignable to state fields (`this.model.user = userFromApi` would fail).
 * Nested proxies still expose `.snapshot()` at runtime via the proxy `get`
 * trap; at the type level, prefer the standalone `snapshot()` helper for
 * nested slices: `snapshot(state.filter)`.
 */
export type BoundResourceState<T> = T extends { [RESOURCE_TYPE_OVERRIDE]: { bound: infer TBound } }
  ? TBound
  : T extends RealtimeResourceDescriptor<infer TData, infer TArg>
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
              : T extends (infer U)[]
                ? BoundResourceState<U>[]
                : T extends (...args: any[]) => any
                  ? T
                  : T extends object
                    ? { [K in keyof T]: BoundResourceState<T[K]> }
                    : T

/**
 * Projects model state into the React selector shape. Query resources expose
 * `.load(arg)`, which opts that selector into lifecycle-managed fetching while
 * returning the same query state flags and data shape.
 */
export type SelectableResourceState<T> = T extends {
  [RESOURCE_TYPE_OVERRIDE]: { selectable: infer TSelectable }
}
  ? TSelectable
  : T extends RealtimeResourceDescriptor<infer TData, infer TArg>
    ? SelectableRealtimeResourceState<TData, TArg>
    : T extends InfiniteResourceDescriptor<infer TData, infer TArg, infer TSuspense>
      ? TSuspense extends true
        ? SuspenseSelectableInfiniteResourceState<TData, TArg>
        : SelectableInfiniteResourceState<TData, TArg>
      : T extends SingleResourceDescriptor<infer TData, infer TArg, infer TSuspense>
        ? TSuspense extends true
          ? SuspenseSelectableSingleResourceState<TData, TArg>
          : SelectableSingleResourceState<TData, TArg>
        : T extends (infer U)[]
          ? SelectableResourceState<U>[]
          : T extends (...args: any[]) => any
            ? T
            : T extends object
              ? { [K in keyof T]: SelectableResourceState<T[K]> }
              : T

type QueryHydrationSeed<TData, TArg> = [TArg] extends [void]
  ? { data: TData; arg?: never }
  : { data: TData; arg: TArg }

type QueryHydrationNode<T> =
  T extends RealtimeResourceDescriptor<unknown, unknown>
    ? never
    : T extends { selectorMethod: 'restore' }
      ? never
      : T extends { [RESOURCE_TYPE_OVERRIDE]: unknown }
        ? never
        : T extends InfiniteResourceDescriptor<infer TData, infer TArg, boolean>
          ? QueryHydrationSeed<TData, TArg>
          : T extends SingleResourceDescriptor<infer TData, infer TArg, boolean>
            ? QueryHydrationSeed<TData, TArg>
            : T extends readonly unknown[]
              ? never
              : T extends (...args: any[]) => any
                ? never
                : T extends object
                  ? HydratableQueryKeys<T> extends never
                    ? never
                    : QueryHydrationEntries<T>
                  : never

type HydratableQueryKeys<T extends object> = {
  [K in keyof T]-?: QueryHydrationNode<T[K]> extends never ? never : K
}[keyof T]

/**
 * Resolved server query values accepted by a generated domain hook's
 * `hydrate()` initializer. Realtime and plain model fields are excluded.
 */
export type QueryHydrationEntries<T extends object> = {
  [K in HydratableQueryKeys<T>]?: QueryHydrationNode<T[K]>
} extends infer TEntries
  ? [HydratableQueryKeys<T>] extends [never]
    ? never
    : TEntries
  : never

export type DependentQueryOptions<TData> = {
  enabled?: (state: any) => boolean
  dependsOn?: (state: any) => any
  refetchInterval?: number | false | ((data: TData, error?: Error) => number | false)
}

export type SingleResourceBuilderOptions<TData, TArg = void> = {
  initialData: TData
  /** @deprecated Use the selector-level `.suspend(arg)` method instead. */
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
  /** @deprecated Use the selector-level `.suspend(arg)` method instead. */
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
  state: ResourceDataLike
  /** Real query promise staged by selector `.suspend()` before the resource is observable. */
  suspendPromise?: Promise<unknown>
  /** Rejection retained for an ErrorBoundary on the next render retry. */
  suspendError?: Error
  /** Whether the staged result still needs to become the active proxy after commit. */
  suspendNeedsCommit?: boolean
  /** Whether resolved hydration still needs lifecycle persistence after commit. */
  hydrationNeedsCommit?: boolean
  /** Whether lifecycle adapters have already attempted restoration for this key. */
  resourceHydrated?: boolean
}

export type SuspenseState = {
  promise: Promise<unknown> | null
  error: Error | null
}

export type QueryBindingRegistry = {
  boundResourceValue: WeakMap<object, Record<string, unknown>>
  boundPathProxy: WeakMap<object, Map<string, object>>
  boundResourceRuntime: WeakMap<object, ResourceRuntimeState>
  /** In-flight selector requests keyed per bound resource and serialized argument. */
  selectorLoads: WeakMap<object, Map<QueryCacheKey, Promise<unknown>>>
  suspense: Map<string, SuspenseState>
  /**
   * Tracks every runtime created in this registry, indexed by the owning
   * model's key. Used by the GC scheduler to enumerate which cache entries
   * belong to a model when its observer count transitions to 0.
   */
  runtimesByModel: Map<symbol, Set<ResourceRuntimeState>>
  /** Provider defaults passed opaquely to resource lifecycle adapters. */
  providerDefaults?: Record<string, unknown>
  /** Provider-scoped services shared by lifecycle adapters. */
  services: Map<symbol, unknown>
  /** Lazily resolves another model from the same provider. */
  getModelState?: (model: object) => object
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
  /**
   * Configured gcTime for this runtime, resolved at bind time from
   * descriptor options + provider defaults. Used when scheduling eviction
   * after the owning model loses its last observer.
   */
  gcTime: number
  /**
   * Pending eviction timers keyed by cache entry key. Populated when the
   * owning model's observer count drops to 0 and cleared when it rises
   * back to >=1.
   */
  gcTimers: Map<QueryCacheKey, ReturnType<typeof setTimeout>>
}

export type ResourceHydratedView = {
  data: unknown
  state: Record<string, unknown>
  fetchedAt: number
  cursorHistory?: Array<string | null>
  lastResult?: unknown
}

export type ResourceLifecycleBindContext = {
  state: ResourceDataLike
  descriptor: AnyResourceDescriptor
  path: string
  runtime: ResourceRuntimeState
  registry: QueryBindingRegistry
}

export type ResourceLifecycleSuccessContext = {
  entry: QueryCacheEntry
  fetchedAt: number
  requestToken: unknown
}

export type ResourceLifecycleApplyContext = {
  /** Resource state immediately before this remote result or stream chunk was applied. */
  previousState: Readonly<ResourceDataLike>
  /** The raw value returned by the query driver. */
  result: unknown
  /** Whether an infinite query appended this result to the current data. */
  appendData: boolean
  requestToken: unknown
}

export type ResourceLifecycleBinding = {
  activate?(key: QueryCacheKey, arg: unknown): void
  hydrate?(): Promise<ResourceHydratedView | undefined>
  beginRequest?(): unknown
  /** Reconcile an applied remote value synchronously before observers flush. */
  afterApply?(context: ResourceLifecycleApplyContext): void
  afterSuccess?(context: ResourceLifecycleSuccessContext): Promise<void> | void
  runInternal?<T>(callback: () => T): T
  preserveSuccessOnError?: boolean
  decorateController?(controller: ResourceDataLike): ResourceDataLike
}

export type ResourceLifecycleFactory = {
  bind(context: ResourceLifecycleBindContext): ResourceLifecycleBinding | undefined
}

export type ResourceTypeOverride<TBound, TSelectable> = {
  [RESOURCE_TYPE_OVERRIDE]: {
    bound: TBound
    selectable: TSelectable
  }
}
