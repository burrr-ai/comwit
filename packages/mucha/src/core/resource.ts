import { snapshot } from './proxy'

const RESOURCE_BRAND = Symbol('muchajs-resource')

const BOUND_RESOURCE_VALUE = new WeakMap<object, Record<string, unknown>>()
const BOUND_PATH_PROXY = new WeakMap<object, Map<string, object>>()

type AsyncResult<T> = T | Promise<T>

type ResourceKind = 'single' | 'page' | 'infinite'

type ResourceDataLike = Record<string, unknown>

export type ResourceBaseState<TData> = {
  data: TData
  isLoading: boolean
  isFetching: boolean
  isSuccess: boolean
  isError: boolean
  error: string | null
}

export type ResourceSingleState<TData> = ResourceBaseState<TData>

export type ResourcePageState<TData> = ResourceBaseState<TData> & {
  page: number
  totalPage: number
  totalCount: number
}

export type ResourceInfiniteState<TData> = ResourceBaseState<TData> & {
  cursor: string | null
  hasMore: boolean
}

export type ResourceContext<TState> = {
  state: Readonly<TState>
}

export type ResourceResult<TState, TData = TState extends { data: infer T } ? T : never> =
  | TState
  | Partial<TState>
  | TData
  | undefined

type BaseResourceDescriptor<TState extends ResourceDataLike, TArg, TData = TState extends { data: infer TDataFromState } ? TDataFromState : never> = {
  [RESOURCE_BRAND]: true
  kind: ResourceKind
  initialState: TState
  load?: (arg: TArg, context: ResourceContext<TState>) => AsyncResult<ResourceResult<TState, TData>>
}

export type SingleResourceDescriptor<TData, TArg = void> =
  BaseResourceDescriptor<ResourceSingleState<TData>, TArg, TData> & ResourceSingleState<TData> & {
    kind: 'single'
  }

export type PageResourceDescriptor<TData, TArg = void> =
  BaseResourceDescriptor<ResourcePageState<TData>, TArg, TData> & ResourcePageState<TData> & {
    kind: 'page'
  }

export type InfiniteResourceDescriptor<TData, TArg = void> =
  BaseResourceDescriptor<ResourceInfiniteState<TData>, TArg, TData> & ResourceInfiniteState<TData> & {
    kind: 'infinite'
    loadMore?: (arg: TArg, context: ResourceContext<ResourceInfiniteState<TData>>) => AsyncResult<ResourceResult<ResourceInfiniteState<TData>, TData>>
  }

export namespace Resource {
  export type Single<TData, TArg = void> = ResourceSingleState<TData>
  export type Page<TData, TArg = void> = ResourcePageState<TData>
  export type Infinite<TData, TArg = void> = ResourceInfiniteState<TData>
}

type ResourceLoadController<TData, TArg = unknown> = {
  load(arg?: TArg): Promise<unknown>
  set(next: unknown): unknown
}

export type BoundSingleResourceState<TData, TArg = unknown> = ResourceSingleState<TData> & ResourceLoadController<TData, TArg>
export type BoundPageResourceState<TData, TArg = unknown> = ResourcePageState<TData> & ResourceLoadController<TData, TArg>
export type BoundInfiniteResourceState<TData, TArg = unknown> = ResourceInfiniteState<TData> & ResourceLoadController<TData, TArg> & {
  loadMore(arg?: TArg): Promise<unknown>
}

export type BoundResourceState<T> = T extends ResourceSingleState<infer TData>
  ? BoundSingleResourceState<TData, unknown>
  : T extends ResourcePageState<infer TData>
    ? BoundPageResourceState<TData, unknown>
    : T extends ResourceInfiniteState<infer TData>
      ? BoundInfiniteResourceState<TData, unknown>
      : T extends (infer U)[]
        ? BoundResourceState<U>[]
        : T extends object
          ? { [K in keyof T]: BoundResourceState<T[K]> }
          : T

export type AnyResourceDescriptor =
  | SingleResourceDescriptor<unknown, unknown>
  | PageResourceDescriptor<unknown, unknown>
  | InfiniteResourceDescriptor<unknown, unknown>

export type ResourceDescriptorMap = Map<string, AnyResourceDescriptor>

export type SingleResourceBuilderOptions<TData, TArg = void> = {
  initialState: ResourceSingleState<TData>
  load?: (arg: TArg, context: ResourceContext<ResourceSingleState<TData>>) => AsyncResult<ResourceResult<ResourceSingleState<TData>, TData>>
}

export type PageResourceBuilderOptions<TData, TArg = void> = {
  initialState: ResourcePageState<TData>
  load?: (arg: TArg, context: ResourceContext<ResourcePageState<TData>>) => AsyncResult<ResourceResult<ResourcePageState<TData>, TData>>
}

export type InfiniteResourceBuilderOptions<TData, TArg = void> = {
  initialState: ResourceInfiniteState<TData>
  load?: (arg: TArg, context: ResourceContext<ResourceInfiniteState<TData>>) => AsyncResult<ResourceResult<ResourceInfiniteState<TData>, TData>>
  loadMore?: (arg: TArg, context: ResourceContext<ResourceInfiniteState<TData>>) => AsyncResult<ResourceResult<ResourceInfiniteState<TData>, TData>>
}

function createSingleDescriptor<TData, TArg = void>(opts: SingleResourceBuilderOptions<TData, TArg>): SingleResourceDescriptor<TData, TArg> {
  return {
    ...opts.initialState,
    kind: 'single',
    [RESOURCE_BRAND]: true,
    initialState: opts.initialState,
    load: opts.load,
  }
}

function createPageDescriptor<TData, TArg = void>(opts: PageResourceBuilderOptions<TData, TArg>): PageResourceDescriptor<TData, TArg> {
  return {
    ...opts.initialState,
    kind: 'page',
    [RESOURCE_BRAND]: true,
    initialState: opts.initialState,
    load: opts.load,
  }
}

function createInfiniteDescriptor<TData, TArg = void>(opts: InfiniteResourceBuilderOptions<TData, TArg>): InfiniteResourceDescriptor<TData, TArg> {
  return {
    ...opts.initialState,
    kind: 'infinite',
    [RESOURCE_BRAND]: true,
    initialState: opts.initialState,
    load: opts.load,
    loadMore: opts.loadMore,
  }
}

export const resource = {
  single: createSingleDescriptor,
  page: createPageDescriptor,
  infinite: createInfiniteDescriptor,
} as const

export function isResourceDescriptor(value: unknown): value is AnyResourceDescriptor {
  return typeof value === 'object' && value !== null && (value as { [RESOURCE_BRAND]?: unknown })[RESOURCE_BRAND] === true
}

function hasNestedPath(pathMap: ResourceDescriptorMap, basePath: string) {
  const dotPrefix = `${basePath}.`
  const bracketPrefix = `${basePath}[`

  for (const key of pathMap.keys()) {
    if (key === basePath) return true
    if (key.startsWith(dotPrefix)) return true
    if (key.startsWith(bracketPrefix)) return true
  }

  return false
}

function normalizeError(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Unknown error'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mergeResult(state: ResourceDataLike, result: unknown, appendData = false) {
  if (result === undefined) return

  if (Array.isArray(result)) {
    state.data = result
    return
  }

  if (isRecord(result)) {
    if (
      appendData &&
      Array.isArray(state.data) &&
      Array.isArray(result.data)
    ) {
      const next: ResourceDataLike = {
        ...result,
        data: [...state.data, ...result.data],
      }
      Object.assign(state, next)
      return
    }

    Object.assign(state, result)
    return
  }

  state.data = result
}

function contextFor<TState>(state: TState) {
  return { state: snapshot(state as ResourceDataLike) as Readonly<TState> }
}

function createResourceAccessor(state: ResourceDataLike, descriptor: AnyResourceDescriptor): ResourceDataLike {
  if (BOUND_RESOURCE_VALUE.has(state)) {
    return BOUND_RESOURCE_VALUE.get(state) as ResourceDataLike
  }

  const runLoad = async (arg: unknown) => {
    state.isLoading = true
    state.isError = false
    state.error = null
    state.isFetching = true

    try {
      if (!descriptor.load) {
        throw new Error('load is not defined for this resource')
      }

      let result: unknown
      if (descriptor.kind === 'single') {
        result = await (descriptor as SingleResourceDescriptor<unknown, unknown>).load!(
          arg,
          contextFor(state) as ResourceContext<ResourceSingleState<unknown>>
        )
      } else if (descriptor.kind === 'page') {
        result = await (descriptor as PageResourceDescriptor<unknown, unknown>).load!(
          arg,
          contextFor(state) as ResourceContext<ResourcePageState<unknown>>
        )
      } else {
        result = await (descriptor as InfiniteResourceDescriptor<unknown, unknown>).load!(
          arg,
          contextFor(state) as ResourceContext<ResourceInfiniteState<unknown>>
        )
      }

      mergeResult(state, result)
      state.isSuccess = true
      return result
    } catch (error) {
      state.isError = true
      state.isSuccess = false
      state.error = normalizeError(error)
      throw error
    } finally {
      state.isLoading = false
      state.isFetching = false
    }
  }

  const runLoadMore = async (arg: unknown) => {
    state.isFetching = true
    state.isError = false
    state.error = null

    try {
      if (descriptor.kind !== 'infinite') {
        throw new Error('loadMore is only supported for infinite resources')
      }

      let result: unknown
      const infinite = descriptor as InfiniteResourceDescriptor<unknown, unknown>

      if (infinite.loadMore) {
        result = await infinite.loadMore(
          arg,
          contextFor(state) as ResourceContext<ResourceInfiniteState<unknown>>
        )
      } else {
        if (!infinite.load) {
          throw new Error('load is not defined for this resource')
        }

        const base = { cursor: (state as ResourceInfiniteState<unknown>).cursor }
        const nextArg =
          arg && typeof arg === 'object' && !Array.isArray(arg)
            ? { ...base, ...(arg as ResourceDataLike) }
            : base

        result = await infinite.load(
          nextArg as unknown,
          contextFor(state) as ResourceContext<ResourceInfiniteState<unknown>>
        )
      }

      mergeResult(state, result, true)
      state.isSuccess = true
      return result
    } catch (error) {
      state.isError = true
      state.isSuccess = false
      state.error = normalizeError(error)
      throw error
    } finally {
      state.isFetching = false
    }
  }

  const bound = new Proxy(state, {
    get(target, prop) {
      if (prop === 'load') return runLoad
      if (prop === 'loadMore') {
        if (descriptor.kind === 'infinite') return runLoadMore
        return undefined
      }
      if (prop === 'set') {
        return (next: unknown) => {
          if (isRecord(next)) {
            Object.assign(target, next)
          } else {
            target.data = next
          }

          target.isSuccess = true
          target.isError = false
          target.error = null
          return next
        }
      }

      return Reflect.get(target, prop)
    },
  })

  BOUND_RESOURCE_VALUE.set(state, bound)
  return bound
}

function bindPath(state: object, descriptors: ResourceDescriptorMap, path = ''): any {
  if (!descriptors.size) return state

  const cached = BOUND_PATH_PROXY.get(state)
  if (cached?.has(path)) {
    return cached.get(path) as object
  }

  const proxy = new Proxy(state, {
    get(target, prop, receiver) {
      if (typeof prop === 'symbol') return Reflect.get(target, prop, receiver)

      const key = String(prop)
      const nextPath = path
        ? Array.isArray(target)
          ? `${path}[${key}]`
          : `${path}.${key}`
        : key
      const descriptor = descriptors.get(nextPath)
      const next = Reflect.get(target, prop, receiver)

      if (descriptor && isRecord(next)) {
        return createResourceAccessor(next as ResourceDataLike, descriptor)
      }

      if (isRecord(next) && hasNestedPath(descriptors, nextPath)) {
        return bindPath(next, descriptors, nextPath)
      }

      return next
    },
  })

  const map = BOUND_PATH_PROXY.get(state) ?? new Map<string, object>()
  map.set(path, proxy)
  BOUND_PATH_PROXY.set(state, map)

  return proxy
}

export function bindResourceState<T extends object>(modelState: T, resourceDescriptors: ResourceDescriptorMap): T {
  if (!resourceDescriptors.size) return modelState
  return bindPath(modelState, resourceDescriptors) as T
}
