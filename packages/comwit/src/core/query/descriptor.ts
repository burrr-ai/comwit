import {
  RESOURCE_BRAND,
  type AnyResourceDescriptor,
  type InfiniteResourceBuilderOptions,
  type InfiniteResourceDescriptor,
  type ResourceFactory,
  type ResourceInfiniteState,
  type ResourceQueryOptions,
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
    queryFn,
    ...optionValues
  } = opts as SingleResourceBuilderOptions<TData, TArg>

  return {
    ...initialState,
    kind: 'single',
    suspense: suspense ?? false,
    [RESOURCE_BRAND]: true,
    initialState,
    options: optionValues as Omit<ResourceQueryOptions<TData, unknown>, 'force'>,
    queryFn,
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
    queryFn,
    ...optionValues
  } = opts as InfiniteResourceBuilderOptions<TData, TArg>

  return {
    ...initialState,
    kind: 'infinite',
    suspense: suspense ?? false,
    [RESOURCE_BRAND]: true,
    initialState,
    options: optionValues as Omit<ResourceQueryOptions<TData, unknown>, 'force'>,
    queryFn,
  }
}

export const query: ResourceFactory = Object.assign(
  (opts: SingleResourceBuilderOptions<unknown, unknown>) => createSingleDescriptor(opts),
  {
    infinite: createInfiniteDescriptor,
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
