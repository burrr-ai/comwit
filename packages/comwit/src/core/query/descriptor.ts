import {
  RESOURCE_BRAND,
  type AnyResourceDescriptor,
  type InfiniteResourceBuilderOptions,
  type InfiniteResourceDescriptor,
  type RealtimeResourceBuilderOptions,
  type RealtimeResourceDescriptor,
  type ResourceFactory,
  type ResourceInfiniteState,
  type ResourceQueryOptions,
  type ResourceRealtimeState,
  type ResourceSingleState,
  type SingleResourceBuilderOptions,
  type SingleResourceDescriptor,
} from './types'

export function createSingleDescriptor<TData, TArg = void>(
  opts: SingleResourceBuilderOptions<TData, TArg>
): SingleResourceDescriptor<TData, TArg> {
  const initialState: ResourceSingleState<TData> = {
    data: opts.initialData,
    isLoading: false,
    isFetching: false,
    isSuccess: false,
    isError: false,
    error: null,
  }

  const {
    initialData: _initialData,
    suspense,
    streamBatchInterval,
    queryFn,
    enabled,
    dependsOn,
    refetchInterval,
    ...optionValues
  } = opts as SingleResourceBuilderOptions<TData, TArg>

  return {
    ...initialState,
    kind: 'single',
    suspense: suspense ?? false,
    streamBatchInterval,
    [RESOURCE_BRAND]: true,
    initialState,
    options: optionValues as Omit<ResourceQueryOptions<TData, unknown>, 'force'>,
    queryFn,
    enabled,
    dependsOn,
    refetchInterval,
  }
}

export function createInfiniteDescriptor<TData, TArg = void>(
  opts: InfiniteResourceBuilderOptions<TData, TArg>
): InfiniteResourceDescriptor<TData, TArg> {
  const initialState: ResourceInfiniteState<TData> = {
    data: opts.initialData,
    cursor: null,
    hasMore: false,
    isLoading: false,
    isFetching: false,
    isSuccess: false,
    isError: false,
    error: null,
  }

  const {
    initialData: _initialData,
    suspense,
    streamBatchInterval,
    queryFn,
    enabled,
    dependsOn,
    refetchInterval,
    ...optionValues
  } = opts as InfiniteResourceBuilderOptions<TData, TArg>

  return {
    ...initialState,
    kind: 'infinite',
    suspense: suspense ?? false,
    streamBatchInterval,
    [RESOURCE_BRAND]: true,
    initialState,
    options: optionValues as Omit<ResourceQueryOptions<TData, unknown>, 'force'>,
    queryFn,
    enabled,
    dependsOn,
    refetchInterval,
  }
}

export function createRealtimeDescriptor<TData, TArg = void>(
  opts: RealtimeResourceBuilderOptions<TData, TArg>
): RealtimeResourceDescriptor<TData, TArg> {
  const initialState: ResourceRealtimeState<TData> = {
    data: opts.initialData,
    isLoading: false,
    isFetching: false,
    isSuccess: false,
    isError: false,
    error: null,
    connectionStatus: 'disconnected',
    isConnected: false,
  }
  const { initialData: _initialData, queryFn, subscribe, ...optionValues } = opts
  return {
    ...initialState,
    kind: 'realtime',
    [RESOURCE_BRAND]: true,
    initialState,
    options: optionValues as Omit<ResourceQueryOptions<TData, unknown>, 'force'>,
    queryFn,
    subscribe,
  }
}

export const query: ResourceFactory = Object.assign(
  (opts: SingleResourceBuilderOptions<unknown, unknown>) => createSingleDescriptor(opts),
  {
    infinite: createInfiniteDescriptor,
    realtime: createRealtimeDescriptor,
  }
) as ResourceFactory

export function isResourceDescriptor(value: unknown): value is AnyResourceDescriptor {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [RESOURCE_BRAND]?: unknown })[RESOURCE_BRAND] === true
  )
}

export function keepPreviousData<TData, TArg = void>(_: TArg, previousData: TData): TData {
  return previousData
}
