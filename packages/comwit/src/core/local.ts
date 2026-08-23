import { snapshot, subscribeOps, type ProxyOp } from './proxy'
import type { Model } from './model'
import { query } from './query/descriptor'
import {
  RESOURCE_LIFECYCLE,
  RESOURCE_TYPE_OVERRIDE,
  type ResourceLifecycleFactory,
} from './query/types'
import type {
  AnyResourceDescriptor,
  BoundInfiniteResourceState,
  BoundSingleResourceState,
  InfiniteResourceBuilderOptions,
  InfiniteResourceDescriptor,
  QueryBindingRegistry,
  QueryCacheEntry,
  QueryCacheKey,
  ResourceBaseState,
  BoundResourceState,
  ResourceDataLike,
  ResourceSetOptions,
  ResourceRuntimeState,
  ResourceTypeOverride,
  SelectableInfiniteResourceState,
  SelectableSingleResourceState,
  SingleResourceBuilderOptions,
  SingleResourceDescriptor,
} from './query/types'

const LOCAL_COLLECTION_BRAND = Symbol('comwit-local-collection')
export const LOCAL_RESOURCE_META = Symbol('comwit-local-resource')

const ENTITY_STORE = 'entities'
const VIEW_STORE = 'views'
const DATABASE_VERSION = 1
const DEFAULT_DATABASE = '@comwit/state'
const DEFAULT_SCOPE = 'default'

export type LocalEntityId = string | number
export type LocalEntity = object
export type LocalEntityFragment<TEntity extends LocalEntity> = TEntity extends {
  id: LocalEntityId
}
  ? Pick<TEntity, 'id'> & Partial<Omit<TEntity, 'id'>>
  : Partial<TEntity>

export type LocalScopeContext = {
  /** Resolve another model lazily from the current provider registry. */
  state<T extends object>(model: Model<T>): BoundResourceState<T>
}

export type LocalScopeResolver = (context: LocalScopeContext) => string | null | undefined

export type LocalScope = string | LocalScopeResolver

type LocalCollectionBaseOptions<TEntity extends LocalEntity> = {
  /** Stable persisted namespace for this entity type. */
  key: string
  /** App-managed schema version. Changing it invalidates and removes older rows. */
  version: number
  /**
   * Optional persisted boundary for this collection. A resolver is evaluated lazily
   * when the resource is used, so it may read another provider-bound model.
   * Returning null/undefined skips IndexedDB for that operation.
   */
  scope?: LocalScope
  /** Advanced merge hook. The default shallowly merges fields present in the response. */
  merge?: (
    current: Readonly<Partial<TEntity>>,
    incoming: Readonly<LocalEntityFragment<TEntity>>
  ) => Partial<TEntity>
  /** Optional server revision used to reject older list/detail responses. */
  revision?: (entity: Readonly<Partial<TEntity>>) => string | number | undefined
}

type LocalCollectionIdentityOptions<TEntity extends LocalEntity> = TEntity extends {
  id: LocalEntityId
}
  ? {
      /** Entity identity extractor. Defaults to `entity.id`. */
      getId?: (entity: Readonly<TEntity>) => LocalEntityId
    }
  : {
      /** Entity identity extractor. Required when the entity has no string/number `id`. */
      getId: (entity: Readonly<TEntity>) => LocalEntityId
    }

export type LocalCollectionOptions<TEntity extends LocalEntity> =
  LocalCollectionBaseOptions<TEntity> & LocalCollectionIdentityOptions<TEntity>

export type LocalCollection<TEntity extends LocalEntity> = Readonly<
  LocalCollectionOptions<TEntity> & {
    getId: (entity: Readonly<TEntity>) => LocalEntityId
    [LOCAL_COLLECTION_BRAND]: true
  }
>

type LocalResourceDescriptor =
  | SingleResourceDescriptor<any, any, any>
  | InfiniteResourceDescriptor<any, any, any>

type ResourceArg<TDescriptor> = TDescriptor extends
  | SingleResourceDescriptor<any, infer TArg, any>
  | InfiniteResourceDescriptor<any, infer TArg, any>
  ? TArg
  : never

type ResourceData<TDescriptor> = TDescriptor extends
  | SingleResourceDescriptor<infer TData, any, any>
  | InfiniteResourceDescriptor<infer TData, any, any>
  ? TData
  : never

export type LocalDataMap<TEntity extends LocalEntity, TData, TMeta = unknown> = {
  /** Split a query data envelope into normalized rows and cloneable view metadata. */
  split: (data: TData) => {
    rows: Array<LocalEntityFragment<TEntity>>
    meta?: TMeta
  }
  /** Rebuild the original query data shape from canonical rows and stored metadata. */
  join: (rows: TEntity[], meta: TMeta | undefined) => TData
}

export type LocalResourceOptions<
  TEntity extends LocalEntity,
  TArg = unknown,
  TData = unknown,
  TMeta = unknown,
> = {
  /** Shared entity collection used by list/detail/infinite resources. */
  source: LocalCollection<TEntity>
  /** Stable view identity override. Defaults to the model field path. */
  key?: string
  /** Override for arguments that cannot use comwit's canonical JSON serializer. */
  serializeArg?: (arg: TArg) => string
  /** Normalize a response envelope such as { items, total }. */
  map?: LocalDataMap<TEntity, TData, TMeta>
}

export type LocalErrorContext = {
  operation: 'open' | 'read' | 'write' | 'cleanup' | 'normalize' | 'scope'
  collection?: string
  resource?: string
}

export type LocalDefaults = {
  /** Dedicated IndexedDB database name. */
  database?: string
  /** User/tenant boundary. Remount ComwitProvider when it changes. */
  scope?: string
  /** Injectable primarily for tests or browser-like runtimes. */
  indexedDB?: IDBFactory
  /** Storage/normalization errors degrade to normal query behavior and are reported here. */
  onError?: (error: unknown, context: LocalErrorContext) => void
}

export type LocalResourceMetadata = {
  source: LocalCollection<LocalEntity>
  key?: string
  serializeArg?: (arg: unknown) => string
  map?: LocalDataMap<LocalEntity, unknown>
  standalone?: boolean
  initialData?: unknown
}

type LocalRestoreController<TState, TArg> = [TArg] extends [void]
  ? { restore(): TState }
  : { restore(arg: TArg): TState }

export type LocalDraftController<TData> = {
  /** Whether the active argument view has a protected local draft. */
  readonly isDirty: boolean
  /** Protect the active view from remote revalidation and optionally replace its data. */
  draft(): TData
  draft(data: TData): TData
  /** Release protection and optionally replace the draft with canonical server data. */
  commitDraft(): TData
  commitDraft(data: TData): TData
  /** Restore the data captured by the first draft() call and release protection. */
  discardDraft(): TData
}

type LocalActionController<TData, TArg> = [TArg] extends [void]
  ? {
      restore(): Promise<unknown>
      set(data: TData, options?: ResourceSetOptions<TArg>): TData
      remove(): TData
    }
  : {
      restore(arg: TArg): Promise<unknown>
      set(data: TData, options: ResourceSetOptions<TArg>): TData
      remove(arg: TArg): TData
    }

export type BoundLocalResource<TData, TArg = void> = ResourceBaseState<TData> &
  LocalActionController<TData, TArg>

export type SelectableLocalResource<TData, TArg = void> = ResourceBaseState<TData> &
  LocalRestoreController<ResourceBaseState<TData>, TArg>

export type Local<TData, TArg = void> = SingleResourceDescriptor<TData, TArg> &
  ResourceTypeOverride<BoundLocalResource<TData, TArg>, SelectableLocalResource<TData, TArg>> & {
    selectorMethod: 'restore'
  }

export type LocalQuery<TData, TArg = void> = SingleResourceDescriptor<TData, TArg> &
  ResourceTypeOverride<
    BoundSingleResourceState<TData, TArg> & LocalDraftController<TData>,
    SelectableSingleResourceState<TData, TArg>
  >

export type LocalInfinite<TData, TArg = void> = InfiniteResourceDescriptor<TData, TArg> &
  ResourceTypeOverride<
    BoundInfiniteResourceState<TData, TArg> & LocalDraftController<TData>,
    SelectableInfiniteResourceState<TData, TArg>
  >

export type LocalStandaloneOptions<
  TData,
  TArg,
  TEntity extends LocalEntity = any,
  TMeta = any,
> = LocalResourceOptions<TEntity, TArg, TData, TMeta> & {
  initialData: TData
}

export type LocalQueryOptions<
  TData,
  TArg,
  TEntity extends LocalEntity = any,
  TMeta = any,
> = SingleResourceBuilderOptions<TData, TArg> & LocalResourceOptions<TEntity, TArg, TData, TMeta>

export type LocalInfiniteOptions<
  TData,
  TArg,
  TEntity extends LocalEntity = any,
  TMeta = any,
> = InfiniteResourceBuilderOptions<TData, TArg> & LocalResourceOptions<TEntity, TArg, TData, TMeta>

export type LocalFactory = {
  <TData, TArg = void, TEntity extends LocalEntity = any, TMeta = any>(
    options: LocalStandaloneOptions<TData, TArg, TEntity, TMeta>
  ): Local<TData, TArg>
  /** @deprecated Prefer local.query() or local.infinite(). */
  <TDescriptor extends LocalResourceDescriptor, TEntity extends LocalEntity, TMeta = unknown>(
    descriptor: TDescriptor,
    options: LocalResourceOptions<
      TEntity,
      ResourceArg<TDescriptor>,
      ResourceData<TDescriptor>,
      TMeta
    >
  ): TDescriptor
  collection<TEntity extends LocalEntity>(
    options: LocalCollectionOptions<TEntity>
  ): LocalCollection<TEntity>
  query<TData, TArg = void, TEntity extends LocalEntity = any, TMeta = any>(
    options: LocalQueryOptions<TData, TArg, TEntity, TMeta>
  ): LocalQuery<TData, TArg>
  infinite<TData, TArg = void, TEntity extends LocalEntity = any, TMeta = any>(
    options: LocalInfiniteOptions<TData, TArg, TEntity, TMeta>
  ): LocalInfinite<TData, TArg>
}

function createCollection<TEntity extends LocalEntity>(
  options: LocalCollectionOptions<TEntity>
): LocalCollection<TEntity> {
  if (!options.key.trim()) {
    throw new Error('local.collection() requires a non-empty key')
  }
  if (!Number.isInteger(options.version) || options.version < 1) {
    throw new Error('local.collection() requires version to be a positive integer')
  }
  if (typeof options.scope === 'string' && !options.scope.trim()) {
    throw new Error('local.collection() scope must be non-empty when provided')
  }

  const getId =
    options.getId ??
    ((entity: Readonly<TEntity>) => (entity as { id?: unknown }).id as LocalEntityId)

  return Object.freeze({
    ...options,
    getId,
    [LOCAL_COLLECTION_BRAND]: true as const,
  }) as LocalCollection<TEntity>
}

function attachLocal<
  TDescriptor extends LocalResourceDescriptor,
  TEntity extends LocalEntity,
  TMeta = unknown,
>(
  descriptor: TDescriptor,
  options: LocalResourceOptions<TEntity, ResourceArg<TDescriptor>, ResourceData<TDescriptor>, TMeta>
): TDescriptor {
  if ((descriptor as { kind: string }).kind === 'realtime') {
    throw new Error('local() supports query() and query.infinite(), not query.realtime()')
  }
  if (!options.source || options.source[LOCAL_COLLECTION_BRAND] !== true) {
    throw new Error('local() requires a source created by local.collection()')
  }
  if (options.key !== undefined && !options.key.trim()) {
    throw new Error('local() key must be non-empty when provided')
  }

  Object.defineProperty(descriptor, LOCAL_RESOURCE_META, {
    value: {
      source: options.source as LocalCollection<LocalEntity>,
      key: options.key,
      serializeArg: options.serializeArg as ((arg: unknown) => string) | undefined,
      map: options.map as LocalDataMap<LocalEntity, unknown> | undefined,
    } satisfies LocalResourceMetadata,
    enumerable: false,
    configurable: false,
    writable: false,
  })

  const existing = descriptor[RESOURCE_LIFECYCLE] ?? []
  Object.defineProperty(descriptor, RESOURCE_LIFECYCLE, {
    value: [...existing, createLocalLifecycleFactory()],
    enumerable: false,
    configurable: false,
    writable: false,
  })

  if (options.serializeArg) {
    descriptor.serializeArg = options.serializeArg as (arg: ResourceArg<TDescriptor>) => string
  }

  return descriptor
}

function splitLocalOptions<
  TEntity extends LocalEntity,
  TArg,
  TData,
  TMeta,
  TOptions extends LocalResourceOptions<TEntity, TArg, TData, TMeta>,
>(options: TOptions) {
  const { source, key, serializeArg, map, ...resourceOptions } = options
  return {
    resourceOptions,
    localOptions: { source, key, serializeArg, map },
  }
}

function createStandaloneLocal<TData, TArg = void, TEntity extends LocalEntity = any, TMeta = any>(
  options: LocalStandaloneOptions<TData, TArg, TEntity, TMeta>
): Local<TData, TArg> {
  const { initialData } = options
  const { localOptions } = splitLocalOptions<TEntity, TArg, TData, TMeta, typeof options>(options)
  const descriptor = query<TData, TArg>({
    initialData,
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: () => initialData,
  }) as Local<TData, TArg>

  descriptor.selectorMethod = 'restore'
  Object.defineProperty(descriptor, RESOURCE_TYPE_OVERRIDE, {
    value: { bound: undefined, selectable: undefined },
    enumerable: false,
  })

  const attached = attachLocal(descriptor, localOptions)
  const metadata = getLocalResourceMetadata(attached)!
  metadata.standalone = true
  metadata.initialData = initialData
  return attached
}

function createLocalQuery<TData, TArg = void, TEntity extends LocalEntity = any, TMeta = any>(
  options: LocalQueryOptions<TData, TArg, TEntity, TMeta>
): LocalQuery<TData, TArg> {
  const { resourceOptions, localOptions } = splitLocalOptions<
    TEntity,
    TArg,
    TData,
    TMeta,
    typeof options
  >(options)
  return attachLocal(
    query(resourceOptions as SingleResourceBuilderOptions<TData, TArg>),
    localOptions
  ) as LocalQuery<TData, TArg>
}

function createLocalInfinite<TData, TArg = void, TEntity extends LocalEntity = any, TMeta = any>(
  options: LocalInfiniteOptions<TData, TArg, TEntity, TMeta>
): LocalInfinite<TData, TArg> {
  const { resourceOptions, localOptions } = splitLocalOptions<
    TEntity,
    TArg,
    TData,
    TMeta,
    typeof options
  >(options)
  return attachLocal(
    query.infinite(resourceOptions as InfiniteResourceBuilderOptions<TData, TArg>),
    localOptions
  ) as LocalInfinite<TData, TArg>
}

function createLocal(...args: unknown[]): LocalResourceDescriptor {
  if (args.length === 1) {
    return createStandaloneLocal(
      args[0] as LocalStandaloneOptions<unknown, unknown, LocalEntity, unknown>
    )
  }
  return attachLocal(
    args[0] as LocalResourceDescriptor,
    args[1] as unknown as LocalResourceOptions<LocalEntity, unknown, unknown>
  )
}

export const local: LocalFactory = Object.assign(createLocal, {
  collection: createCollection,
  query: createLocalQuery,
  infinite: createLocalInfinite,
}) as LocalFactory

export function getLocalResourceMetadata(descriptor: object): LocalResourceMetadata | undefined {
  return (
    descriptor as AnyResourceDescriptor & {
      [LOCAL_RESOURCE_META]?: LocalResourceMetadata
    }
  )[LOCAL_RESOURCE_META]
}

type DataKind = 'array' | 'entity' | 'null' | 'mapped'

type EntityRecord = {
  key: string
  scope: string
  collection: string
  version: number
  id: LocalEntityId
  value: LocalEntity
  updatedAt: number
  localRevision: number
}

type ViewRecord = {
  key: string
  scope: string
  collection: string
  version: number
  resource: string
  kind: 'single' | 'infinite'
  argKey: string
  dataKind: DataKind
  dataMeta?: unknown
  ids: LocalEntityId[]
  state: Record<string, unknown>
  fetchedAt: number
  lastAccessedAt: number
  cursorHistory: Array<string | null>
  localRevision: number
}

type NormalizedState = {
  dataKind: DataKind
  dataMeta?: unknown
  ids: LocalEntityId[]
  entities: Array<{ id: LocalEntityId; value: LocalEntity }>
  state: Record<string, unknown>
}

export type LocalHydratedView = {
  data: unknown
  state: Record<string, unknown>
  fetchedAt: number
  cursorHistory: Array<string | null>
}

type ReconcileInput = {
  incoming: NormalizedState
  activeView: ActiveView
  previousView?: ViewRecord
  existing: Map<string, EntityRecord>
  binding: LocalResourceBinding
  fetchedAt: number
  cursorHistory: Array<string | null>
  local: boolean
  dirtyIds: Set<string>
  requestStartRevision?: number
  mutationRevision?: number
}

type ReconcileOutput = {
  entities: EntityRecord[]
  view: ViewRecord
  changedEntityKeys: Set<string>
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction failed'))
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
  })
}

class LocalDatabase {
  private databasePromise?: Promise<IDBDatabase>

  constructor(
    private readonly factory: IDBFactory,
    private readonly name: string
  ) {}

  private open(): Promise<IDBDatabase> {
    if (this.databasePromise) return this.databasePromise

    this.databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = this.factory.open(this.name, DATABASE_VERSION)
      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(ENTITY_STORE)) {
          database.createObjectStore(ENTITY_STORE, { keyPath: 'key' })
        }
        if (!database.objectStoreNames.contains(VIEW_STORE)) {
          database.createObjectStore(VIEW_STORE, { keyPath: 'key' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Unable to open IndexedDB'))
    })

    return this.databasePromise
  }

  async readView(key: string): Promise<{ view: ViewRecord; entities: EntityRecord[] } | undefined> {
    const database = await this.open()
    const transaction = database.transaction([VIEW_STORE, ENTITY_STORE], 'readonly')
    const completion = transactionDone(transaction)
    try {
      const view = (await requestResult(transaction.objectStore(VIEW_STORE).get(key))) as
        | ViewRecord
        | undefined

      if (!view) {
        await completion
        return undefined
      }

      const entityStore = transaction.objectStore(ENTITY_STORE)
      const entities = await Promise.all(
        view.ids.map((id) =>
          requestResult(
            entityStore.get(entityStorageKey(view.scope, view.collection, view.version, id))
          )
        )
      )
      await completion

      if (entities.some((entity) => entity === undefined)) return undefined
      return { view, entities: entities as EntityRecord[] }
    } catch (error) {
      await completion.catch(() => {})
      throw error
    }
  }

  async reconcile(
    viewKey: string,
    scope: string,
    collection: string,
    version: number,
    incomingIds: LocalEntityId[],
    reconcile: (
      previousView: ViewRecord | undefined,
      existing: Map<string, EntityRecord>
    ) => ReconcileOutput
  ): Promise<ReconcileOutput> {
    const database = await this.open()
    const transaction = database.transaction([VIEW_STORE, ENTITY_STORE], 'readwrite')
    const completion = transactionDone(transaction)
    try {
      const views = transaction.objectStore(VIEW_STORE)
      const entities = transaction.objectStore(ENTITY_STORE)
      const previousView = (await requestResult(views.get(viewKey))) as ViewRecord | undefined
      const ids = new Map<string, LocalEntityId>()

      for (const id of previousView?.ids ?? []) ids.set(idToken(id), id)
      for (const id of incomingIds) ids.set(idToken(id), id)

      const existing = new Map<string, EntityRecord>()
      await Promise.all(
        [...ids.values()].map(async (id) => {
          const record = (await requestResult(
            entities.get(entityStorageKey(scope, collection, version, id))
          )) as EntityRecord | undefined
          if (record) existing.set(idToken(id), record)
        })
      )

      const output = reconcile(previousView, existing)
      for (const record of output.entities) entities.put(record)
      views.put(output.view)
      await completion
      return output
    } catch (error) {
      try {
        transaction.abort()
      } catch {}
      await completion.catch(() => {})
      throw error
    }
  }

  async cleanupOldVersions(scope: string, collection: string, version: number): Promise<void> {
    const database = await this.open()
    const transaction = database.transaction([VIEW_STORE, ENTITY_STORE], 'readwrite')
    const completion = transactionDone(transaction)

    const clean = (storeName: string) =>
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(storeName).openCursor()
        request.onerror = () => reject(request.error ?? new Error('IndexedDB cursor failed'))
        request.onsuccess = () => {
          const cursor = request.result
          if (!cursor) {
            resolve()
            return
          }
          const value = cursor.value as EntityRecord | ViewRecord
          if (
            value.scope === scope &&
            value.collection === collection &&
            value.version !== version
          ) {
            cursor.delete()
          }
          cursor.continue()
        }
      })

    try {
      await Promise.all([clean(VIEW_STORE), clean(ENTITY_STORE)])
      await completion
    } catch (error) {
      try {
        transaction.abort()
      } catch {}
      await completion.catch(() => {})
      throw error
    }
  }
}

function idToken(id: LocalEntityId): string {
  return `${typeof id === 'number' ? 'n' : 's'}:${String(id)}`
}

function entityStorageKey(
  scope: string,
  collection: string,
  version: number,
  id: LocalEntityId
): string {
  return JSON.stringify([scope, collection, version, idToken(id)])
}

function viewStorageKey(
  scope: string,
  collection: string,
  version: number,
  resource: string,
  kind: string,
  argKey: string
): string {
  return JSON.stringify([scope, collection, version, resource, kind, argKey])
}

function isEntity(value: unknown): value is LocalEntity {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function entityId(
  collection: LocalCollection<LocalEntity>,
  value: unknown
): LocalEntityId | undefined {
  if (!isEntity(value)) return undefined
  const id = collection.getId(value)
  if (typeof id === 'string') return id
  if (typeof id === 'number' && Number.isFinite(id)) return id
  return undefined
}

function normalizeState(
  state: Readonly<ResourceDataLike>,
  metadata: LocalResourceMetadata
): NormalizedState {
  const plain = snapshot(state) as ResourceDataLike
  const data = plain.data
  let dataKind: DataKind
  let values: LocalEntity[]
  let dataMeta: unknown

  if (metadata.map) {
    const mapped = metadata.map.split(data)
    if (!mapped || !Array.isArray(mapped.rows) || !mapped.rows.every(isEntity)) {
      throw new Error('local() map.split() must return entity object rows')
    }
    dataKind = 'mapped'
    values = mapped.rows as LocalEntity[]
    dataMeta = mapped.meta
  } else if (data === null) {
    dataKind = 'null'
    values = []
  } else if (Array.isArray(data)) {
    if (!data.every(isEntity)) {
      throw new Error('local() array data must contain entity objects')
    }
    dataKind = 'array'
    values = data as LocalEntity[]
  } else if (isEntity(data)) {
    dataKind = 'entity'
    values = [data]
  } else {
    throw new Error('local() data must be an entity, an entity array, or null')
  }

  const entities = values.map((value) => {
    const id = entityId(metadata.source, value)
    if (id === undefined) {
      throw new Error('local() getId() must return a finite number or string for every entity')
    }
    return { id, value }
  })

  const stateMeta: Record<string, unknown> = { ...plain }
  delete stateMeta.data
  delete stateMeta.isLoading
  delete stateMeta.isFetching
  delete stateMeta.isSuccess
  delete stateMeta.isError
  delete stateMeta.error

  return {
    dataKind,
    dataMeta,
    ids: entities.map((entity) => entity.id),
    entities,
    state: stateMeta,
  }
}

function hydrateData(
  view: Pick<ViewRecord, 'dataKind' | 'dataMeta'>,
  values: LocalEntity[],
  metadata: LocalResourceMetadata
): unknown {
  if (view.dataKind === 'null') return null
  if (view.dataKind === 'entity') return values[0] ?? null
  if (view.dataKind === 'mapped') {
    if (!metadata.map) {
      throw new Error('local() view requires the map option that created it')
    }
    return metadata.map.join(values, view.dataMeta)
  }
  return values
}

function compareRevision(
  collection: LocalCollection<LocalEntity>,
  current: LocalEntity,
  incoming: LocalEntity
): number {
  if (!collection.revision) return 0
  const currentRevision = collection.revision(current)
  const incomingRevision = collection.revision(incoming)
  if (currentRevision === undefined || incomingRevision === undefined) return 0
  if (incomingRevision < currentRevision) return -1
  if (incomingRevision > currentRevision) return 1
  return 0
}

function mergeEntity(
  collection: LocalCollection<LocalEntity>,
  current: LocalEntity | undefined,
  incoming: LocalEntity
): LocalEntity {
  if (!current) return { ...incoming }
  if (compareRevision(collection, current, incoming) < 0) return current
  if (collection.merge) {
    const merged = collection.merge(current, incoming)
    return { ...incoming, ...merged } as LocalEntity
  }
  return { ...current, ...incoming }
}

function idsFromOp(
  op: ProxyOp | undefined,
  state: ResourceDataLike,
  metadata: LocalResourceMetadata
): Set<string> {
  const ids = new Set<string>()
  if (!op || op[1][0] !== 'data') return ids

  const add = (value: unknown) => {
    const id = entityId(metadata.source, value)
    if (id !== undefined) ids.add(idToken(id))
    if (Array.isArray(value)) {
      for (const item of value) {
        const itemId = entityId(metadata.source, item)
        if (itemId !== undefined) ids.add(idToken(itemId))
      }
    }
  }

  add(op[0] === 'set' ? op[2] : undefined)
  add(op[0] === 'set' ? op[3] : op[2])

  const data = state.data
  const index = op[1][1]
  if (Array.isArray(data) && (typeof index === 'string' || typeof index === 'number')) {
    add(data[Number(index)])
  } else {
    add(data)
  }

  if (ids.size === 0 && metadata.map) {
    const plain = snapshot(state) as ResourceDataLike
    const mapped = metadata.map.split(plain.data)
    add(mapped.rows)
  }

  return ids
}

export type LocalRegistryState = {
  manager: LocalManager
  bindings: WeakMap<object, LocalResourceBinding>
}

const LOCAL_REGISTRY_SERVICE = Symbol('comwit-local-registry-service')

export function createLocalRegistryState(defaults?: LocalDefaults): LocalRegistryState {
  const factory =
    defaults?.indexedDB ?? (typeof globalThis !== 'undefined' ? globalThis.indexedDB : undefined)
  return {
    manager: new LocalManager(defaults, factory),
    bindings: new WeakMap(),
  }
}

class LocalManager {
  readonly defaultScope: string
  private readonly database?: LocalDatabase
  private readonly onError?: LocalDefaults['onError']
  private readonly bindings = new Set<LocalResourceBinding>()
  private readonly entityCache = new Map<string, EntityRecord>()
  private readonly viewCache = new Map<string, ViewRecord>()
  private readonly collectionRevisions = new Map<string, number>()
  private readonly cleanedVersions = new Set<string>()
  private writeTail: Promise<void> = Promise.resolve()

  constructor(defaults: LocalDefaults | undefined, factory: IDBFactory | undefined) {
    this.defaultScope = defaults?.scope ?? DEFAULT_SCOPE
    this.onError = defaults?.onError
    if (factory) {
      this.database = new LocalDatabase(factory, defaults?.database ?? DEFAULT_DATABASE)
    }
  }

  register(binding: LocalResourceBinding): void {
    this.bindings.add(binding)
  }

  revision(scope: string, collection: LocalCollection<LocalEntity>): number {
    return this.collectionRevisions.get(this.collectionNamespace(scope, collection)) ?? 0
  }

  markLocalMutation(scope: string, collection: LocalCollection<LocalEntity>): number {
    const namespace = this.collectionNamespace(scope, collection)
    const revision = (this.collectionRevisions.get(namespace) ?? 0) + 1
    this.collectionRevisions.set(namespace, revision)
    return revision
  }

  private collectionNamespace(scope: string, collection: LocalCollection<LocalEntity>): string {
    return JSON.stringify([scope, collection.key, collection.version])
  }

  private entityCacheKey(
    scope: string,
    collection: LocalCollection<LocalEntity>,
    id: LocalEntityId
  ): string {
    return JSON.stringify([this.collectionNamespace(scope, collection), idToken(id)])
  }

  report(error: unknown, context: LocalErrorContext): void {
    this.onError?.(error, context)
  }

  private async ensureVersion(
    scope: string,
    collection: LocalCollection<LocalEntity>
  ): Promise<void> {
    if (!this.database) return
    const namespace = this.collectionNamespace(scope, collection)
    if (this.cleanedVersions.has(namespace)) return
    this.cleanedVersions.add(namespace)
    try {
      await this.database.cleanupOldVersions(scope, collection.key, collection.version)
    } catch (error) {
      this.report(error, { operation: 'cleanup', collection: collection.key })
    }
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = this.writeTail.then(task, task)
    this.writeTail = result.then(
      () => undefined,
      () => undefined
    )
    return result
  }

  async hydrate(binding: LocalResourceBinding): Promise<LocalHydratedView | undefined> {
    const activeView = binding.activeView
    if (!this.database || !activeView) return undefined
    await this.writeTail
    await this.ensureVersion(activeView.scope, binding.metadata.source)

    try {
      const stored = await this.database.readView(activeView.key)
      if (!stored) return undefined
      if (!binding.matchesActiveView(activeView)) {
        binding.refreshScope(true)
        return undefined
      }

      stored.view.lastAccessedAt = Date.now()
      this.viewCache.set(stored.view.key, stored.view)
      for (const record of stored.entities) {
        this.entityCache.set(
          this.entityCacheKey(activeView.scope, binding.metadata.source, record.id),
          record
        )
        const currentRevision = this.revision(activeView.scope, binding.metadata.source)
        if (record.localRevision > currentRevision) {
          this.collectionRevisions.set(
            this.collectionNamespace(activeView.scope, binding.metadata.source),
            record.localRevision
          )
        }
      }

      return {
        data: hydrateData(
          stored.view,
          stored.entities.map((record) => record.value),
          binding.metadata
        ),
        state: stored.view.state,
        fetchedAt: stored.view.fetchedAt,
        cursorHistory: [...stored.view.cursorHistory],
      }
    } catch (error) {
      this.report(error, {
        operation: 'read',
        collection: binding.metadata.source.key,
        resource: binding.resource,
      })
      return undefined
    }
  }

  reconcileRemoteEmission(
    binding: LocalResourceBinding,
    previousState: Readonly<ResourceDataLike>,
    requestStartRevision: number
  ): void {
    const activeView = binding.activeView
    if (!activeView) return

    let incoming: NormalizedState
    try {
      incoming = normalizeState(binding.state, binding.metadata)
    } catch (error) {
      this.report(error, {
        operation: 'normalize',
        collection: binding.metadata.source.key,
        resource: binding.resource,
      })
      return
    }

    let previous: NormalizedState | undefined
    try {
      previous = normalizeState(previousState, binding.metadata)
    } catch {
      // The active collection cache below remains a valid fallback for a new view.
    }

    const collection = binding.metadata.source
    const previousById = new Map(
      (previous?.entities ?? []).map((entity) => [idToken(entity.id), entity.value])
    )
    const values = incoming.entities.map(({ id, value }) => {
      const cached = this.entityCache.get(this.entityCacheKey(activeView.scope, collection, id))
      const protectLocal = cached !== undefined && cached.localRevision > requestStartRevision
      if (protectLocal) return cached.value

      const current = previousById.get(idToken(id)) ?? cached?.value
      return mergeEntity(collection, current, value)
    })

    binding.applyRemoteEmission(incoming, values)
  }

  async commitRemote(
    binding: LocalResourceBinding,
    entry: QueryCacheEntry,
    fetchedAt: number,
    requestStartRevision: number
  ): Promise<void> {
    await this.commit(binding, entry, fetchedAt, false, new Set(), requestStartRevision)
  }

  async commitLocal(
    binding: LocalResourceBinding,
    dirtyIds: Set<string>,
    mutationRevision: number
  ): Promise<void> {
    const entry = binding.activeEntry()
    if (!entry) return
    await this.commit(
      binding,
      entry,
      entry.lastFetchedAt,
      true,
      dirtyIds,
      undefined,
      mutationRevision
    )
  }

  private async commit(
    binding: LocalResourceBinding,
    entry: QueryCacheEntry,
    fetchedAt: number,
    local: boolean,
    dirtyIds: Set<string>,
    requestStartRevision?: number,
    mutationRevision?: number
  ): Promise<void> {
    const activeView = binding.activeView
    if (!activeView) return

    let incoming: NormalizedState
    try {
      incoming = normalizeState(binding.state, binding.metadata)
    } catch (error) {
      this.report(error, {
        operation: 'normalize',
        collection: binding.metadata.source.key,
        resource: binding.resource,
      })
      return
    }

    const reconcile = (
      previousView: ViewRecord | undefined,
      existingFromStore: Map<string, EntityRecord>
    ): ReconcileOutput => {
      const input: ReconcileInput = {
        incoming,
        activeView,
        previousView,
        existing: existingFromStore,
        binding,
        fetchedAt,
        cursorHistory: [...entry.cursorHistory],
        local,
        dirtyIds,
        requestStartRevision,
        mutationRevision,
      }
      return this.reconcile(input)
    }

    let output: ReconcileOutput
    try {
      output = await this.enqueue(async () => {
        await this.ensureVersion(activeView.scope, binding.metadata.source)
        if (this.database) {
          return this.database.reconcile(
            activeView.key,
            activeView.scope,
            binding.metadata.source.key,
            binding.metadata.source.version,
            incoming.ids,
            reconcile
          )
        }
        return reconcile(this.viewCache.get(activeView.key), new Map())
      })
    } catch (error) {
      this.report(error, {
        operation: 'write',
        collection: binding.metadata.source.key,
        resource: binding.resource,
      })
      output = reconcile(this.viewCache.get(activeView.key), new Map())
    }

    this.viewCache.set(output.view.key, output.view)
    for (const record of output.entities) {
      this.entityCache.set(
        this.entityCacheKey(activeView.scope, binding.metadata.source, record.id),
        record
      )
    }

    const remainsActive = binding.matchesActiveView(activeView)
    if (!remainsActive) binding.refreshScope(true)

    if (!local && remainsActive) {
      const byId = new Map(output.entities.map((record) => [idToken(record.id), record]))
      const ordered = output.view.ids
        .map(
          (id) =>
            byId.get(idToken(id)) ??
            this.entityCache.get(this.entityCacheKey(activeView.scope, binding.metadata.source, id))
        )
        .filter((record): record is EntityRecord => record !== undefined)
      if (ordered.length === output.view.ids.length) {
        binding.applyView(output.view, ordered)
      }
    }

    const changed = output.entities.filter((record) =>
      output.changedEntityKeys.has(idToken(record.id))
    )
    this.fanOut(activeView.scope, binding.metadata.source, changed, binding)
  }

  private reconcile(input: ReconcileInput): ReconcileOutput {
    const { activeView, binding, incoming, previousView, local, requestStartRevision } = input
    const collection = binding.metadata.source
    const namespace = this.collectionNamespace(activeView.scope, collection)
    const localRevision = input.mutationRevision ?? this.collectionRevisions.get(namespace) ?? 0

    const existing = new Map(input.existing)
    for (const id of new Set([...incoming.ids, ...(previousView?.ids ?? [])])) {
      const cached = this.entityCache.get(this.entityCacheKey(activeView.scope, collection, id))
      if (cached) existing.set(idToken(id), cached)
    }

    const records: EntityRecord[] = []
    const changedEntityKeys = new Set<string>()

    for (const { id, value: entity } of incoming.entities) {
      const token = idToken(id)
      const current = existing.get(token)
      const protectLocal =
        !local &&
        current !== undefined &&
        (binding.isDirty ||
          (requestStartRevision !== undefined && current.localRevision > requestStartRevision))
      const nextValue = protectLocal
        ? current.value
        : mergeEntity(collection, current?.value, entity)
      const nextLocalRevision =
        local && input.dirtyIds.has(token) ? localRevision : (current?.localRevision ?? 0)
      const record: EntityRecord = {
        key: entityStorageKey(activeView.scope, collection.key, collection.version, id),
        scope: activeView.scope,
        collection: collection.key,
        version: collection.version,
        id,
        value: nextValue,
        updatedAt: Date.now(),
        localRevision: nextLocalRevision,
      }
      records.push(record)
      if (!current || current.value !== nextValue || nextLocalRevision !== current.localRevision) {
        changedEntityKeys.add(token)
      }
    }

    const protectLocalView =
      !local &&
      previousView !== undefined &&
      (binding.isDirty ||
        (requestStartRevision !== undefined && previousView.localRevision > requestStartRevision))

    const ids = protectLocalView ? [...previousView.ids] : [...incoming.ids]
    if (protectLocalView) {
      for (const id of previousView.ids) {
        const current = existing.get(idToken(id))
        if (current && !records.some((record) => idToken(record.id) === idToken(id))) {
          records.push(current)
        }
      }
    }

    const view: ViewRecord = {
      ...activeView,
      dataKind: protectLocalView ? previousView.dataKind : incoming.dataKind,
      dataMeta: protectLocalView ? previousView.dataMeta : incoming.dataMeta,
      ids,
      state: protectLocalView ? previousView.state : incoming.state,
      fetchedAt: protectLocalView ? previousView.fetchedAt : input.fetchedAt,
      lastAccessedAt: Date.now(),
      cursorHistory: protectLocalView ? previousView.cursorHistory : input.cursorHistory,
      localRevision: local ? localRevision : protectLocalView ? previousView.localRevision : 0,
    }

    return { entities: records, view, changedEntityKeys }
  }

  fanOut(
    scope: string,
    collection: LocalCollection<LocalEntity>,
    records: EntityRecord[],
    source?: LocalResourceBinding
  ): void {
    if (records.length === 0) return
    for (const binding of this.bindings) {
      if (
        binding === source ||
        binding.activeView?.scope !== scope ||
        binding.metadata.source.key !== collection.key ||
        binding.metadata.source.version !== collection.version
      ) {
        continue
      }
      binding.applyEntities(records)
    }
    if (source?.activeView?.scope === scope) source.applyEntities(records)
  }
}

type ActiveView = Omit<
  ViewRecord,
  'dataKind' | 'ids' | 'state' | 'fetchedAt' | 'lastAccessedAt' | 'cursorHistory' | 'localRevision'
>

type LocalRequestToken = {
  scope?: string
  revision: number
}

type LocalDraftState = {
  baseline: unknown
  current: ResourceDataLike
}

export class LocalResourceBinding {
  activeView?: ActiveView
  private activeScope?: string
  private scopeInitialized = false
  private suppress = 0
  private pendingMutation = false
  private pendingMutationRevision = 0
  private readonly dirtyIds = new Set<string>()
  private readonly drafts = new Map<QueryCacheKey, LocalDraftState>()

  constructor(
    readonly manager: LocalManager,
    readonly metadata: LocalResourceMetadata,
    readonly resource: string,
    readonly state: ResourceDataLike,
    readonly runtime: ResourceRuntimeState,
    readonly descriptor: AnyResourceDescriptor,
    private readonly registry: QueryBindingRegistry
  ) {
    manager.register(this)
    subscribeOps(state, (op) => this.onOperation(op))
  }

  runInternal<T>(callback: () => T): T {
    this.suppress++
    try {
      return callback()
    } finally {
      this.suppress--
    }
  }

  private resolveScope(): string | undefined {
    const source = this.metadata.source
    if (source.scope === undefined) return this.manager.defaultScope
    if (typeof source.scope === 'string') return source.scope

    const getModelState = this.registry.getModelState
    if (!getModelState) return undefined

    try {
      const state: LocalScopeContext['state'] = <T extends object>(model: Model<T>) =>
        getModelState(model) as BoundResourceState<T>
      const resolved = source.scope({ state })
      if (resolved == null) return undefined
      if (typeof resolved === 'string' && resolved.trim()) return resolved
      throw new Error('local.collection() scope resolver must return a non-empty string or null')
    } catch (error) {
      this.manager.report(error, {
        operation: 'scope',
        collection: source.key,
        resource: this.resource,
      })
      return undefined
    }
  }

  private setScope(scope: string | undefined, resetOnChange: boolean): void {
    const changed = this.scopeInitialized && this.activeScope !== scope
    this.scopeInitialized = true
    this.activeScope = scope

    if (!changed) return
    this.runtime.fetchId++
    this.runtime.cacheEntries.clear()
    this.drafts.clear()
    if (resetOnChange) {
      this.runInternal(() =>
        Object.assign(this.state, structuredClone(this.descriptor.initialState))
      )
    }
  }

  private createActiveView(argKey: QueryCacheKey, scope: string): ActiveView {
    const source = this.metadata.source
    const resource = this.metadata.key ?? this.resource
    return {
      key: viewStorageKey(
        scope,
        source.key,
        source.version,
        resource,
        this.descriptor.kind,
        argKey
      ),
      scope,
      collection: source.key,
      version: source.version,
      resource,
      kind: this.descriptor.kind as 'single' | 'infinite',
      argKey,
    }
  }

  activate(argKey: QueryCacheKey): void {
    const scope = this.resolveScope()
    this.setScope(scope, true)
    this.activeView = scope ? this.createActiveView(argKey, scope) : undefined
  }

  matchesActiveView(view: ActiveView): boolean {
    return (
      this.resolveScope() === view.scope &&
      this.activeView?.key === view.key &&
      this.activeView.scope === view.scope
    )
  }

  refreshScope(resetOnChange: boolean): void {
    const scope = this.resolveScope()
    this.setScope(scope, resetOnChange)
    this.activeView =
      scope && this.runtime.activeKey
        ? this.createActiveView(this.runtime.activeKey, scope)
        : undefined
  }

  activeEntry(): QueryCacheEntry | undefined {
    if (!this.runtime.activeKey) return undefined
    return this.runtime.cacheEntries.get(this.runtime.activeKey)
  }

  currentRevision(): LocalRequestToken {
    const scope = this.activeView?.scope
    return {
      scope,
      revision: scope ? this.manager.revision(scope, this.metadata.source) : 0,
    }
  }

  get isDirty(): boolean {
    return this.runtime.activeKey !== undefined && this.drafts.has(this.runtime.activeKey)
  }

  beginDraft(): void {
    const key = this.runtime.activeKey
    if (key === undefined) {
      throw new Error('local draft requires an active view; query or restore it first')
    }
    if (this.drafts.has(key)) return

    const plain = snapshot(this.state) as ResourceDataLike
    this.drafts.set(key, {
      baseline: structuredClone(plain.data),
      current: structuredClone(plain),
    })
  }

  updateDraft(): void {
    const key = this.runtime.activeKey
    const draft = key === undefined ? undefined : this.drafts.get(key)
    if (draft) draft.current = structuredClone(snapshot(this.state) as ResourceDataLike)
  }

  commitDraft(): void {
    const key = this.runtime.activeKey
    if (key !== undefined) this.drafts.delete(key)
  }

  discardDraft(): unknown {
    const key = this.runtime.activeKey
    if (key === undefined || !this.drafts.has(key)) return this.state.data

    const baseline = this.drafts.get(key)?.baseline
    this.drafts.delete(key)
    return structuredClone(baseline)
  }

  restoreDraftState(previousState: Readonly<ResourceDataLike>): void {
    const key = this.runtime.activeKey
    const draft = key === undefined ? undefined : this.drafts.get(key)
    if (!draft) return

    const restored = structuredClone(draft.current)
    for (const field of ['isLoading', 'isFetching', 'isSuccess', 'isError', 'error']) {
      if (field in previousState) restored[field] = previousState[field]
    }
    this.runInternal(() => Object.assign(this.state, restored))
  }

  async hydrate(): Promise<LocalHydratedView | undefined> {
    const hydrated = await this.manager.hydrate(this)
    if (!hydrated) return undefined
    return hydrated
  }

  reconcileRemoteEmission(
    previousState: Readonly<ResourceDataLike>,
    requestToken: LocalRequestToken
  ): void {
    const resolvedScope = this.resolveScope()
    if (
      !requestToken.scope ||
      requestToken.scope !== resolvedScope ||
      this.activeView?.scope !== resolvedScope
    ) {
      return
    }
    if (this.isDirty) {
      this.restoreDraftState(previousState)
      return
    }
    this.manager.reconcileRemoteEmission(this, previousState, requestToken.revision)
  }

  async commitRemote(
    entry: QueryCacheEntry,
    fetchedAt: number,
    requestToken: LocalRequestToken
  ): Promise<void> {
    const resolvedScope = this.resolveScope()

    if (requestToken.scope && requestToken.scope !== resolvedScope) {
      this.setScope(resolvedScope, true)
      this.activeView =
        resolvedScope && this.runtime.activeKey
          ? this.createActiveView(this.runtime.activeKey, resolvedScope)
          : undefined
      return
    }

    if (!requestToken.scope && resolvedScope) {
      this.setScope(resolvedScope, false)
      this.activeView = this.runtime.activeKey
        ? this.createActiveView(this.runtime.activeKey, resolvedScope)
        : undefined
      requestToken = {
        scope: resolvedScope,
        revision: this.manager.revision(resolvedScope, this.metadata.source),
      }
    }

    if (!this.activeView || !requestToken.scope) return
    if (this.isDirty) {
      this.syncActiveCache()
      return
    }
    await this.manager.commitRemote(this, entry, fetchedAt, requestToken.revision)
  }

  syncActiveCache(): void {
    const entry = this.activeEntry()
    if (!entry) return
    entry.state = snapshot(this.state) as ResourceDataLike
  }

  applyRemoteEmission(incoming: NormalizedState, values: LocalEntity[]): void {
    this.runInternal(() => {
      this.state.data = hydrateData(incoming, values, this.metadata)
    })
  }

  applyView(view: ViewRecord, records: EntityRecord[]): void {
    this.runInternal(() => {
      this.state.data = hydrateData(
        view,
        records.map((record) => record.value),
        this.metadata
      )
      Object.assign(this.state, view.state)
    })
    this.syncActiveCache()
  }

  applyEntities(records: EntityRecord[]): void {
    if (records.length === 0) return
    const byId = new Map(records.map((record) => [idToken(record.id), record.value]))

    this.runInternal(() => {
      const data = this.state.data
      if (this.metadata.map) {
        const plain = snapshot(this.state) as ResourceDataLike
        const mapped = this.metadata.map.split(plain.data)
        const rows = mapped.rows.map((item) => {
          const id = entityId(this.metadata.source, item)
          const next = id === undefined ? undefined : byId.get(idToken(id))
          return (next ?? item) as LocalEntity
        })
        this.state.data = this.metadata.map.join(rows, mapped.meta)
      } else if (Array.isArray(data)) {
        for (const item of data) {
          const id = entityId(this.metadata.source, item)
          if (id === undefined) continue
          const next = byId.get(idToken(id))
          if (next) Object.assign(item, next)
        }
      } else if (isEntity(data)) {
        const id = entityId(this.metadata.source, data)
        const next = id === undefined ? undefined : byId.get(idToken(id))
        if (next) Object.assign(data, next)
      }
    })
    this.syncActiveCache()
  }

  private onOperation(op: ProxyOp | undefined): void {
    if (this.suppress > 0 || !op || op[1][0] !== 'data') return
    const scope = this.resolveScope()
    if (!this.scopeInitialized || this.activeScope !== scope) {
      this.setScope(scope, true)
      this.activeView =
        scope && this.runtime.activeKey
          ? this.createActiveView(this.runtime.activeKey, scope)
          : undefined
      return
    }
    if (!this.activeView) return
    for (const id of idsFromOp(op, this.state, this.metadata)) this.dirtyIds.add(id)
    if (this.pendingMutation) return
    this.pendingMutation = true
    this.pendingMutationRevision = this.manager.markLocalMutation(
      this.activeView.scope,
      this.metadata.source
    )

    queueMicrotask(() => {
      this.pendingMutation = false
      const dirty = new Set(this.dirtyIds)
      const mutationRevision = this.pendingMutationRevision
      this.dirtyIds.clear()
      this.syncActiveCache()
      this.updateDraft()
      void this.manager.commitLocal(this, dirty, mutationRevision)
    })
  }
}

export function bindLocalResource(
  localRegistry: LocalRegistryState | undefined,
  queryRegistry: QueryBindingRegistry,
  descriptor: AnyResourceDescriptor,
  path: string,
  state: ResourceDataLike,
  runtime: ResourceRuntimeState
): LocalResourceBinding | undefined {
  if (!localRegistry) return undefined
  const metadata = getLocalResourceMetadata(descriptor)
  if (!metadata) return undefined

  const existing = localRegistry.bindings.get(state)
  if (existing) return existing

  const binding = new LocalResourceBinding(
    localRegistry.manager,
    metadata,
    path,
    state,
    runtime,
    descriptor,
    queryRegistry
  )
  localRegistry.bindings.set(state, binding)
  return binding
}

function createLocalLifecycleFactory(): ResourceLifecycleFactory {
  return {
    bind({ registry, descriptor, path, state, runtime }) {
      let localRegistry = registry.services.get(LOCAL_REGISTRY_SERVICE) as
        | LocalRegistryState
        | undefined
      if (!localRegistry) {
        localRegistry = createLocalRegistryState(
          registry.providerDefaults?.local as LocalDefaults | undefined
        )
        registry.services.set(LOCAL_REGISTRY_SERVICE, localRegistry)
      }

      const binding = bindLocalResource(localRegistry, registry, descriptor, path, state, runtime)
      if (!binding) return undefined
      const metadata = getLocalResourceMetadata(descriptor)

      return {
        activate(key) {
          binding.activate(key)
        },
        hydrate() {
          return binding.hydrate()
        },
        beginRequest() {
          return binding.currentRevision()
        },
        afterApply({ previousState, requestToken }) {
          binding.reconcileRemoteEmission(
            previousState,
            requestToken && typeof requestToken === 'object'
              ? (requestToken as LocalRequestToken)
              : { revision: 0 }
          )
        },
        afterSuccess({ entry, fetchedAt, requestToken }) {
          return binding.commitRemote(
            entry,
            fetchedAt,
            requestToken && typeof requestToken === 'object'
              ? (requestToken as LocalRequestToken)
              : { revision: 0 }
          )
        },
        runInternal(callback) {
          return binding.runInternal(callback)
        },
        preserveSuccessOnError: true,
        decorateController(controller) {
          return new Proxy(controller, {
            get(target, prop, receiver) {
              if (!metadata?.standalone && prop === 'isDirty') return binding.isDirty
              if (!metadata?.standalone && prop === 'draft') {
                return (...args: unknown[]) => {
                  binding.beginDraft()
                  if (args.length === 0) return binding.state.data
                  const set = Reflect.get(target, 'set', receiver)
                  if (typeof set !== 'function') return args[0]
                  const data = set.call(target, args[0])
                  binding.updateDraft()
                  return data
                }
              }
              if (!metadata?.standalone && prop === 'commitDraft') {
                return (...args: unknown[]) => {
                  binding.commitDraft()
                  const set = Reflect.get(target, 'set', receiver)
                  if (typeof set !== 'function') return binding.state.data
                  return set.call(target, args.length === 0 ? binding.state.data : args[0])
                }
              }
              if (!metadata?.standalone && prop === 'discardDraft') {
                return () => {
                  const baseline = binding.discardDraft()
                  const set = Reflect.get(target, 'set', receiver)
                  return typeof set === 'function' ? set.call(target, baseline) : baseline
                }
              }
              if (metadata?.standalone && prop === 'remove') {
                return (arg?: unknown) => {
                  const set = Reflect.get(target, 'set', receiver)
                  if (typeof set !== 'function') return metadata.initialData
                  return set.call(target, metadata.initialData, { arg })
                }
              }
              return Reflect.get(target, prop, receiver)
            },
          })
        },
      }
    },
  }
}
