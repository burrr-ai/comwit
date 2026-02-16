import { snapshot } from './proxy'

const RESOURCE_BRAND = Symbol('muchajs-resource')

type AsyncResult<T> = T | Promise<T>

type ResourceKind = 'single' | 'infinite'

type ResourceDataLike = Record<string, unknown>

type ResourceResultShape<TState extends ResourceDataLike, TData = TState extends { data: infer T } ? T : never> =
  | TState
  | ({ data: TData } & Partial<Omit<TState, 'data'>>)
  | undefined

export type PlaceholderData<TData, TArg = void> = TData | ((arg: TArg, previousData: TData) => TData)

export function keepPreviousData<TData, TArg = void>(_: TArg, previousData: TData): TData {
    return previousData
}

const RESOURCE_QUERY_OPTION_KEYS = new Set(['force', 'placeholderData', 'staleTime', 'cacheTime', 'gcTime'])

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

type ResourceQueryOptions<TData, TArg> = QueryQueryOptions<TData, TArg>

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

export type ResourceResult<TData> = ResourceResultShape<ResourceBaseState<TData>, TData>

export type Query<TData, TArg = void> = SingleResourceDescriptor<TData, TArg>

export namespace Query {
    export type Single<TData, TArg = void> = Query<TData, TArg>
    export type Infinite<TData, TArg = void> = InfiniteResourceDescriptor<TData, TArg>
}

export type QueryInfinite<TData, TArg = void> = InfiniteResourceDescriptor<TData, TArg>

type SingleResourceLoadResult<TData> = TData | ResourceResult<TData>
type InfiniteResourceLoadResult<TData> = ResourceInfiniteState<TData> | ({ data: TData } & Partial<Omit<ResourceInfiniteState<TData>, 'data'>>)

type BaseResourceDescriptor<TState extends ResourceDataLike, TArg, TResult> = {
    [RESOURCE_BRAND]: true
    kind: ResourceKind
    initialState: TState
    options: Omit<ResourceQueryOptions<TState extends ResourceBaseState<infer TData> ? TData : never, unknown>, 'force'>
    queryFn: (arg: TArg, context: ResourceContext<TState>) => AsyncResult<TResult>
}

type SingleResourceDescriptor<TData, TArg = void> = BaseResourceDescriptor<ResourceSingleState<TData>, TArg, SingleResourceLoadResult<TData>> &
    ResourceSingleState<TData> & {
        kind: 'single'
    }

type InfiniteResourceDescriptor<TData, TArg = void> = BaseResourceDescriptor<ResourceInfiniteState<TData>, TArg, InfiniteResourceLoadResult<TData>> &
    ResourceInfiniteState<TData> & {
        kind: 'infinite'
    }

export type AnyResourceDescriptor =
    | SingleResourceDescriptor<unknown, unknown>
    | InfiniteResourceDescriptor<unknown, unknown>

export type ResourceDescriptorMap = Map<string, AnyResourceDescriptor>

interface ResourceSingleQueryController<TData, TArg> {
    query(arg: TArg, options?: ResourceQueryOptions<TData, TArg>): Promise<unknown>
    query(options?: ResourceQueryOptions<TData, TArg>): Promise<unknown>
    refetch(): Promise<unknown>
    set(next: unknown): unknown
}

interface ResourceInfiniteQueryController<TData, TArg> extends ResourceSingleQueryController<TData, TArg> {
    nextFetch(arg: TArg, options?: ResourceQueryOptions<TData, TArg>): Promise<unknown>
    nextFetch(options?: ResourceQueryOptions<TData, TArg>): Promise<unknown>
    previousFetch(arg: TArg, options?: ResourceQueryOptions<TData, TArg>): Promise<unknown>
    previousFetch(options?: ResourceQueryOptions<TData, TArg>): Promise<unknown>
}

export type BoundSingleResourceState<TData, TArg = unknown> = ResourceSingleState<TData> & ResourceSingleQueryController<TData, TArg>
export type BoundInfiniteResourceState<TData, TArg = unknown> = ResourceInfiniteState<TData> & ResourceInfiniteQueryController<TData, TArg>

export type BoundResourceState<T> = T extends InfiniteResourceDescriptor<infer TData, infer TArg>
    ? BoundInfiniteResourceState<TData, TArg>
    : T extends SingleResourceDescriptor<infer TData, infer TArg>
        ? BoundSingleResourceState<TData, TArg>
        : T extends ResourceInfiniteState<infer TData>
            ? BoundInfiniteResourceState<TData, unknown>
            : T extends ResourceSingleState<infer TData>
                ? BoundSingleResourceState<TData, unknown>
        : T extends (infer U)[]
            ? BoundResourceState<U>[]
            : T extends object
                ? { [K in keyof T]: BoundResourceState<T[K]> }
                : T

type SingleResourceBuilderOptions<TData, TArg = void> = {
    initialData: TData
    queryFn: (arg: TArg, context: ResourceContext<ResourceSingleState<TData>>) => AsyncResult<SingleResourceLoadResult<TData>>
} & Omit<ResourceQueryOptions<TData, TArg>, 'force'>

type InfiniteResourceBuilderOptions<TData, TArg = void> = {
    initialData: TData
    queryFn: (arg: TArg, context: ResourceContext<ResourceInfiniteState<TData>>) => AsyncResult<InfiniteResourceLoadResult<TData>>
} & Omit<ResourceQueryOptions<TData, TArg>, 'force'>

type ResourceFactory = {
    <TData, TArg = void>(opts: SingleResourceBuilderOptions<TData, TArg>): SingleResourceDescriptor<TData, TArg>
    infinite: <TData, TArg = void>(opts: InfiniteResourceBuilderOptions<TData, TArg>) => InfiniteResourceDescriptor<TData, TArg>
}

type QueryMode = 'replace' | 'append'

type QueryCacheKey = string

type QueryCacheEntry = {
    key: QueryCacheKey
    arg: unknown
    hasQueried: boolean
    lastFetchedAt: number
    lastResult?: unknown
    cursorHistory: Array<string | null>
    gcTime?: number
    state: ResourceDataLike
}

export type QueryBindingRegistry = {
    boundResourceValue: WeakMap<object, Record<string, unknown>>
    boundPathProxy: WeakMap<object, Map<string, object>>
    boundResourceRuntime: WeakMap<object, ResourceRuntimeState>
}

export function createQueryBindingRegistry(): QueryBindingRegistry {
    return {
        boundResourceValue: new WeakMap(),
        boundPathProxy: new WeakMap(),
        boundResourceRuntime: new WeakMap(),
    }
}

type ResourceRuntimeState = {
    path: string
    lastArg?: unknown
    activeKey?: QueryCacheKey
    cacheEntries: Map<QueryCacheKey, QueryCacheEntry>
}

function createSingleDescriptor<TData, TArg = void>(opts: SingleResourceBuilderOptions<TData, TArg>): SingleResourceDescriptor<TData, TArg> {
    const initialState: ResourceSingleState<TData> = {
        data: opts.initialData,
        isLoading: false,
        isFetching: false,
        isSuccess: false,
        isError: false,
        error: null,
    }

    const { initialData: _initialData, queryFn, ...optionValues } = opts as SingleResourceBuilderOptions<TData, TArg>

    return {
        ...initialState,
        kind: 'single',
        [RESOURCE_BRAND]: true,
        initialState,
        options: optionValues as Omit<ResourceQueryOptions<TData, unknown>, 'force'>,
        queryFn,
    }
}

function createInfiniteDescriptor<TData, TArg = void>(opts: InfiniteResourceBuilderOptions<TData, TArg>): InfiniteResourceDescriptor<TData, TArg> {
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

    const { initialData: _initialData, queryFn, ...optionValues } = opts as InfiniteResourceBuilderOptions<TData, TArg>

    return {
        ...initialState,
        kind: 'infinite',
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

function isResourceQueryCallOptions(value: unknown): value is ResourceQueryOptions<unknown, unknown> {
    if (!isRecord(value)) return false

    for (const key of Object.keys(value)) {
        if (RESOURCE_QUERY_OPTION_KEYS.has(key)) return true
    }

    return false
}

function resolveGcTime(options: ResourceDefaultOptions): number | undefined {
    if (typeof options.cacheTime === 'number') return options.cacheTime
    if (typeof options.gcTime === 'number') return options.gcTime
    return undefined
}

function mergeResult(state: ResourceDataLike, result: unknown, appendData = false) {
    if (result === undefined) return

    if (Array.isArray(result)) {
        state.data = result
        return
    }

    if (isRecord(result)) {
        const hasData = 'data' in result

        if (
            appendData &&
            hasData &&
            Array.isArray(state.data) &&
            Array.isArray((result as { data?: unknown }).data)
        ) {
            const next: ResourceDataLike = {
                ...result,
                data: [...state.data, ...(result as { data: unknown[] }).data],
            }
            Object.assign(state, next)
            return
        }

        if (hasData) {
            Object.assign(state, result)
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

function parseQueryArgs(args: unknown[]) {
    if (args.length === 1 && isResourceQueryCallOptions(args[0])) {
        return {
            hasArg: false,
            arg: undefined,
            options: args[0] as ResourceQueryOptions<unknown, unknown>,
        }
    }

    if (args.length === 0) {
        return {
            hasArg: false,
            arg: undefined,
            options: undefined,
        }
    }

    return {
        hasArg: true,
        arg: args[0],
        options: args[1] as ResourceQueryOptions<unknown, unknown> | undefined,
    }
}

function withCursor(arg: unknown, cursor: string | null | undefined) {
    if (cursor === undefined || cursor === null) {
        return arg
    }

    if (isRecord(arg)) {
        return {
            ...arg,
            cursor,
        }
    }

    return {
        cursor,
    }
}

function stableSerialize(value: unknown, seen = new WeakSet<object>()): unknown {
    if (value === null || typeof value !== 'object') return value
    if (value instanceof Date) return value.toISOString()

    if (Array.isArray(value)) {
        return value.map(item => stableSerialize(item, seen))
    }

    if (seen.has(value as object)) {
        return '[Circular]'
    }
    seen.add(value as object)

    const source = value as Record<string, unknown>
    const keys = Object.keys(source).sort()
    const out: Record<string, unknown> = {}

    for (const key of keys) {
        out[key] = stableSerialize(source[key], seen)
    }

    seen.delete(value as object)
    return out
}

function serializeQueryArg(arg: unknown) {
    try {
        const serialized = JSON.stringify(stableSerialize(arg))
        return serialized === undefined ? '__undefined__' : serialized
    }
    catch {
        return `__unserializable__:${String(arg)}`
    }
}

function cloneRuntime(path: string): ResourceRuntimeState {
    return {
        path,
        lastArg: undefined,
        activeKey: undefined,
        cacheEntries: new Map(),
    }
}

function createCacheEntry(state: ResourceDataLike, key: QueryCacheKey, arg: unknown, gcTime?: number): QueryCacheEntry {
    return {
        key,
        arg,
        hasQueried: false,
        lastFetchedAt: 0,
        cursorHistory: [],
        gcTime,
        state: snapshot(state) as ResourceDataLike,
    }
}

function applyCachedState(target: ResourceDataLike, cached: QueryCacheEntry) {
    Object.assign(target, cached.state)
    target.isLoading = false
    target.isFetching = false
}

function updateCachedState(entry: QueryCacheEntry, source: ResourceDataLike) {
    entry.state = snapshot(source) as ResourceDataLike
}

function cleanupExpiredCacheEntries(runtime: ResourceRuntimeState, now: number) {
    for (const [key, entry] of runtime.cacheEntries) {
        if (typeof entry.gcTime !== 'number') continue
        if (entry.lastFetchedAt === 0) continue
        if (now - entry.lastFetchedAt < entry.gcTime) continue

        runtime.cacheEntries.delete(key)
        if (runtime.activeKey === key) {
            runtime.activeKey = undefined
            runtime.lastArg = undefined
        }
    }
}

function applyPlaceholderData<TData, TArg>(state: ResourceBaseState<TData>, arg: TArg, placeholderData?: PlaceholderData<TData, TArg>) {
    if (placeholderData === undefined) return

    if (typeof placeholderData === 'function') {
        state.data = (placeholderData as (queryArg: TArg, previousData: TData) => TData)(arg, state.data)
        return
    }

    state.data = placeholderData as TData
}

function normalizeDescriptorOptions<TData, TArg>(
    descriptor: AnyResourceDescriptor,
    defaultOptions: ResourceDefaultOptions | undefined,
    callOptions: unknown,
) {
    const descriptorOptions = descriptor.options as Omit<ResourceQueryOptions<TData, unknown>, 'force'>
    const merged: ResourceQueryOptions<TData, TArg> = {
        ...(defaultOptions as Omit<ResourceQueryOptions<TData, unknown>, 'force'> as ResourceQueryOptions<TData, TArg>),
        ...(descriptorOptions as ResourceQueryOptions<TData, TArg>),
        ...((isResourceQueryCallOptions(callOptions) ? callOptions : {}) as ResourceQueryOptions<TData, TArg>),
    }

    return merged
}

function createResourceAccessor(
    state: ResourceDataLike,
    descriptor: AnyResourceDescriptor,
    path: string,
    defaults: QueryDefaultOptions | undefined,
    registry: QueryBindingRegistry,
): ResourceDataLike {
    if (registry.boundResourceValue.has(state)) {
        return registry.boundResourceValue.get(state) as ResourceDataLike
    }

    const runtime = registry.boundResourceRuntime.get(state) ?? cloneRuntime(path)
    runtime.path = path
    registry.boundResourceRuntime.set(state, runtime)

    const getActiveEntry = () => {
        if (!runtime.activeKey) return
        return runtime.cacheEntries.get(runtime.activeKey)
    }

    const executeQuery = async (
        arg: unknown,
        rawOptions: ResourceQueryOptions<unknown, unknown> | undefined,
        hasArg: boolean,
        mode: QueryMode,
        isRefetch = false,
    ): Promise<unknown> => {
        const activeEntryBefore = getActiveEntry()
        if (isRefetch && !activeEntryBefore?.hasQueried) {
            return
        }

        const effectiveOptions = normalizeDescriptorOptions<unknown, unknown>(descriptor, defaults, rawOptions)

        const staleTime = typeof effectiveOptions.staleTime === 'number' ? effectiveOptions.staleTime : 0
        const gcTime = resolveGcTime(effectiveOptions)
        const now = Date.now()
        cleanupExpiredCacheEntries(runtime, now)

        const queryArg = isRefetch ? activeEntryBefore?.arg : (hasArg ? arg : runtime.lastArg)
        const queryKey = serializeQueryArg(queryArg)
        runtime.lastArg = queryArg
        runtime.activeKey = queryKey

        let entry = runtime.cacheEntries.get(queryKey)
        if (!entry) {
            entry = createCacheEntry(state, queryKey, queryArg, gcTime)
            runtime.cacheEntries.set(queryKey, entry)
        }

        entry.gcTime = gcTime
        entry.arg = queryArg

        const shouldFetch = isRefetch
            || (
                !entry.hasQueried
                || effectiveOptions.force === true
                || staleTime === 0
                || now - entry.lastFetchedAt >= staleTime
            )

        if (!shouldFetch && entry.hasQueried) {
            applyCachedState(state, entry)
            return entry.lastResult
        }

        if (entry.hasQueried) {
            applyCachedState(state, entry)
        }

        applyPlaceholderData(
            state as ResourceBaseState<unknown>,
            queryArg as never,
            effectiveOptions.placeholderData as PlaceholderData<unknown, unknown> | undefined,
        )

        if (descriptor.kind === 'infinite') {
            const infiniteHistory = entry.cursorHistory
            const currentCursor = (state as ResourceInfiniteState<unknown>).cursor

            if (mode === 'replace') {
                if (infiniteHistory.length === 0) {
                    infiniteHistory.push(currentCursor)
                } else {
                    infiniteHistory.length = 1
                    infiniteHistory[0] = currentCursor
                }
            } else if (mode === 'append' && infiniteHistory[infiniteHistory.length - 1] !== currentCursor) {
                infiniteHistory.push(currentCursor)
            }
        }

        state.isLoading = !state.isSuccess && !state.isError
        state.isFetching = true
        state.isError = false
        state.error = null

        try {
            let result: unknown

            if (descriptor.kind === 'single') {
                const typedDescriptor = descriptor as SingleResourceDescriptor<unknown, unknown>
                result = await typedDescriptor.queryFn(queryArg as unknown, contextFor(state) as ResourceContext<ResourceSingleState<unknown>>)

                if (result !== undefined) {
                    state.data = result
                }
            }
            else {
                const typedDescriptor = descriptor as InfiniteResourceDescriptor<unknown, unknown>
                result = await typedDescriptor.queryFn(queryArg as unknown, contextFor(state) as ResourceContext<ResourceInfiniteState<unknown>>)
                mergeResult(state, result, mode === 'append')
            }

            state.isSuccess = true
            entry.hasQueried = true
            entry.lastFetchedAt = Date.now()
            entry.lastResult = result
            updateCachedState(entry, state)

            if (descriptor.kind === 'infinite') {
                const infiniteHistory = entry.cursorHistory
                const nextCursor = (state as ResourceInfiniteState<unknown>).cursor

                if (mode === 'append' && infiniteHistory[infiniteHistory.length - 1] !== nextCursor) {
                    infiniteHistory.push(nextCursor)
                } else if (mode === 'replace' && infiniteHistory.length > 0) {
                    infiniteHistory[infiniteHistory.length - 1] = nextCursor
                }
            }

            return result
        }
        catch (error) {
            state.isError = true
            state.isSuccess = false
            state.error = normalizeError(error)
            throw error
        }
        finally {
            state.isLoading = false
            state.isFetching = false
        }
    }

    const query = (...rawArgs: unknown[]) => {
        const parsed = parseQueryArgs(rawArgs)
        return executeQuery(parsed.arg, parsed.options, parsed.hasArg, 'replace', false)
    }

    const refetch = () => {
        const active = getActiveEntry()
        if (!active?.hasQueried) return
        return executeQuery(active.arg, undefined, true, 'replace', true)
    }

    const nextFetch = (...rawArgs: unknown[]) => {
        const parsed = parseQueryArgs(rawArgs)
        if (descriptor.kind !== 'infinite') return
        const active = getActiveEntry()
        if (!active) return

        const cursor = (state as ResourceInfiniteState<unknown>).cursor
        const nextArg = withCursor(parsed.hasArg ? parsed.arg : active.arg, cursor)
        return executeQuery(nextArg, parsed.options, true, 'append', false)
    }

    const previousFetch = (...rawArgs: unknown[]) => {
        const parsed = parseQueryArgs(rawArgs)
        if (descriptor.kind !== 'infinite') return
        const active = getActiveEntry()
        if (!active) return

        if (active.cursorHistory.length < 2) {
            return active.lastResult
        }

        active.cursorHistory.pop()
        const prevCursor = active.cursorHistory[active.cursorHistory.length - 1]
        const previousArg = withCursor(parsed.hasArg ? parsed.arg : active.arg, prevCursor)
        return executeQuery(previousArg, parsed.options, true, 'replace', false)
    }

    const bound = new Proxy(state, {
        get(target, prop) {
            if (prop === 'query') return query
            if (prop === 'refetch') return refetch
            if (prop === 'nextFetch') {
                if (descriptor.kind === 'infinite') return nextFetch
                return undefined
            }
            if (prop === 'previousFetch') {
                if (descriptor.kind === 'infinite') return previousFetch
                return undefined
            }
            if (prop === 'set') {
                return (next: unknown) => {
                    if (isRecord(next)) {
                        Object.assign(target, next)
                    }
                    else {
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

    registry.boundResourceValue.set(state, bound)
    return bound
}

function bindPath(state: object, descriptors: ResourceDescriptorMap, path = '', defaults: QueryDefaultOptions | undefined, registry: QueryBindingRegistry): any {
    if (!descriptors.size) return state

    const cached = registry.boundPathProxy.get(state)
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
                return createResourceAccessor(next as ResourceDataLike, descriptor, nextPath, defaults, registry)
            }

            if (isRecord(next) && hasNestedPath(descriptors, nextPath)) {
                return bindPath(next, descriptors, nextPath, defaults, registry)
            }

            return next
        },
    })

    const map = registry.boundPathProxy.get(state) ?? new Map<string, object>()
    map.set(path, proxy)
    registry.boundPathProxy.set(state, map)

    return proxy
}

export function bindResourceState<T extends object>(
    modelState: T,
    resourceDescriptors: ResourceDescriptorMap,
    defaults?: QueryDefaultOptions,
    registry: QueryBindingRegistry = createQueryBindingRegistry(),
): T {
    if (!resourceDescriptors.size) return modelState
    return bindPath(modelState, resourceDescriptors, '', defaults, registry) as T
}
