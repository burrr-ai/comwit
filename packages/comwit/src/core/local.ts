import { snapshot, subscribeOps, type ProxyOp } from './proxy'
import type {
  AnyResourceDescriptor,
  InfiniteResourceDescriptor,
  QueryCacheEntry,
  QueryCacheKey,
  ResourceDataLike,
  ResourceRuntimeState,
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
export type LocalEntity = { id: LocalEntityId } & Record<string, unknown>
export type LocalEntityFragment<TEntity extends LocalEntity> = Pick<TEntity, 'id'> &
  Partial<Omit<TEntity, 'id'>>

export type LocalCollectionOptions<TEntity extends LocalEntity> = {
  /** Stable persisted namespace for this entity type. */
  key: string
  /** App-managed schema version. Changing it invalidates and removes older rows. */
  version: number
  /** Advanced merge hook. The default shallowly merges fields present in the response. */
  merge?: (
    current: Readonly<Partial<TEntity>>,
    incoming: Readonly<LocalEntityFragment<TEntity>>
  ) => Partial<TEntity>
  /** Optional server revision used to reject older list/detail responses. */
  revision?: (entity: Readonly<Partial<TEntity>>) => string | number | undefined
}

export type LocalCollection<TEntity extends LocalEntity> = Readonly<
  LocalCollectionOptions<TEntity> & {
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
  operation: 'open' | 'read' | 'write' | 'cleanup' | 'normalize'
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
}

export type LocalFactory = {
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

  return Object.freeze({
    ...options,
    [LOCAL_COLLECTION_BRAND]: true as const,
  })
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

  return descriptor
}

export const local: LocalFactory = Object.assign(attachLocal, {
  collection: createCollection,
}) as LocalFactory

export function getLocalResourceMetadata(
  descriptor: AnyResourceDescriptor
): LocalResourceMetadata | undefined {
  return (
    descriptor as AnyResourceDescriptor & {
      [LOCAL_RESOURCE_META]?: LocalResourceMetadata
    }
  )[LOCAL_RESOURCE_META]
}

export function serializeResourceArg(
  descriptor: AnyResourceDescriptor,
  arg: unknown,
  fallback: (arg: unknown) => string
): string {
  const serialize = getLocalResourceMetadata(descriptor)?.serializeArg
  if (!serialize) return fallback(arg)
  const result = serialize(arg)
  if (typeof result !== 'string') {
    throw new Error('local() serializeArg must return a string')
  }
  return result
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
  entities: LocalEntity[]
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
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const id = (value as { id?: unknown }).id
  return typeof id === 'string' || (typeof id === 'number' && Number.isFinite(id))
}

function normalizeState(state: ResourceDataLike, metadata: LocalResourceMetadata): NormalizedState {
  const plain = snapshot(state) as ResourceDataLike
  const data = plain.data
  let dataKind: DataKind
  let entities: LocalEntity[]
  let dataMeta: unknown

  if (metadata.map) {
    const mapped = metadata.map.split(data)
    if (!mapped || !Array.isArray(mapped.rows) || !mapped.rows.every(isEntity)) {
      throw new Error('local() map.split() must return entity rows with string or number ids')
    }
    dataKind = 'mapped'
    entities = mapped.rows as LocalEntity[]
    dataMeta = mapped.meta
  } else if (data === null) {
    dataKind = 'null'
    entities = []
  } else if (Array.isArray(data)) {
    if (!data.every(isEntity)) {
      throw new Error('local() array data must contain objects with a string or number id')
    }
    dataKind = 'array'
    entities = data as LocalEntity[]
  } else if (isEntity(data)) {
    dataKind = 'entity'
    entities = [data]
  } else {
    throw new Error('local() data must be an entity, an entity array, or null')
  }

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
  view: ViewRecord,
  records: EntityRecord[],
  metadata: LocalResourceMetadata
): unknown {
  if (view.dataKind === 'null') return null
  if (view.dataKind === 'entity') return records[0]?.value ?? null
  if (view.dataKind === 'mapped') {
    if (!metadata.map) {
      throw new Error('local() view requires the map option that created it')
    }
    return metadata.map.join(
      records.map((record) => record.value),
      view.dataMeta
    )
  }
  return records.map((record) => record.value)
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
    return { ...merged, id: incoming.id } as LocalEntity
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
    if (isEntity(value)) ids.add(idToken(value.id))
    if (Array.isArray(value)) {
      for (const item of value) if (isEntity(item)) ids.add(idToken(item.id))
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

export function createLocalRegistryState(defaults?: LocalDefaults): LocalRegistryState {
  const factory =
    defaults?.indexedDB ?? (typeof globalThis !== 'undefined' ? globalThis.indexedDB : undefined)
  return {
    manager: new LocalManager(defaults, factory),
    bindings: new WeakMap(),
  }
}

class LocalManager {
  readonly scope: string
  private readonly database?: LocalDatabase
  private readonly onError?: LocalDefaults['onError']
  private readonly bindings = new Set<LocalResourceBinding>()
  private readonly entityCache = new Map<string, EntityRecord>()
  private readonly viewCache = new Map<string, ViewRecord>()
  private readonly collectionRevisions = new Map<string, number>()
  private readonly cleanedVersions = new Set<string>()
  private writeTail: Promise<void> = Promise.resolve()

  constructor(defaults: LocalDefaults | undefined, factory: IDBFactory | undefined) {
    this.scope = defaults?.scope ?? DEFAULT_SCOPE
    this.onError = defaults?.onError
    if (factory) {
      this.database = new LocalDatabase(factory, defaults?.database ?? DEFAULT_DATABASE)
    }
  }

  register(binding: LocalResourceBinding): void {
    this.bindings.add(binding)
  }

  revision(collection: LocalCollection<LocalEntity>): number {
    return this.collectionRevisions.get(this.collectionNamespace(collection)) ?? 0
  }

  markLocalMutation(collection: LocalCollection<LocalEntity>): number {
    const namespace = this.collectionNamespace(collection)
    const revision = (this.collectionRevisions.get(namespace) ?? 0) + 1
    this.collectionRevisions.set(namespace, revision)
    return revision
  }

  private collectionNamespace(collection: LocalCollection<LocalEntity>): string {
    return JSON.stringify([this.scope, collection.key, collection.version])
  }

  private entityCacheKey(collection: LocalCollection<LocalEntity>, id: LocalEntityId): string {
    return JSON.stringify([this.collectionNamespace(collection), idToken(id)])
  }

  private report(error: unknown, context: LocalErrorContext): void {
    this.onError?.(error, context)
  }

  private async ensureVersion(collection: LocalCollection<LocalEntity>): Promise<void> {
    if (!this.database) return
    const namespace = this.collectionNamespace(collection)
    if (this.cleanedVersions.has(namespace)) return
    this.cleanedVersions.add(namespace)
    try {
      await this.database.cleanupOldVersions(this.scope, collection.key, collection.version)
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
    if (!this.database || !binding.activeView) return undefined
    await this.writeTail
    await this.ensureVersion(binding.metadata.source)

    try {
      const stored = await this.database.readView(binding.activeView.key)
      if (!stored) return undefined

      stored.view.lastAccessedAt = Date.now()
      this.viewCache.set(stored.view.key, stored.view)
      for (const record of stored.entities) {
        this.entityCache.set(this.entityCacheKey(binding.metadata.source, record.id), record)
        const currentRevision = this.revision(binding.metadata.source)
        if (record.localRevision > currentRevision) {
          this.collectionRevisions.set(
            this.collectionNamespace(binding.metadata.source),
            record.localRevision
          )
        }
      }

      return {
        data: hydrateData(stored.view, stored.entities, binding.metadata),
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
    if (!binding.activeView) return

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
        await this.ensureVersion(binding.metadata.source)
        if (this.database) {
          return this.database.reconcile(
            binding.activeView!.key,
            this.scope,
            binding.metadata.source.key,
            binding.metadata.source.version,
            incoming.ids,
            reconcile
          )
        }
        return reconcile(this.viewCache.get(binding.activeView!.key), new Map())
      })
    } catch (error) {
      this.report(error, {
        operation: 'write',
        collection: binding.metadata.source.key,
        resource: binding.resource,
      })
      output = reconcile(this.viewCache.get(binding.activeView.key), new Map())
    }

    this.viewCache.set(output.view.key, output.view)
    for (const record of output.entities) {
      this.entityCache.set(this.entityCacheKey(binding.metadata.source, record.id), record)
    }

    if (!local) {
      const byId = new Map(output.entities.map((record) => [idToken(record.id), record]))
      const ordered = output.view.ids
        .map(
          (id) =>
            byId.get(idToken(id)) ??
            this.entityCache.get(this.entityCacheKey(binding.metadata.source, id))
        )
        .filter((record): record is EntityRecord => record !== undefined)
      if (ordered.length === output.view.ids.length) {
        binding.applyView(output.view, ordered)
      }
    }

    const changed = output.entities.filter((record) =>
      output.changedEntityKeys.has(idToken(record.id))
    )
    this.fanOut(binding.metadata.source, changed, binding)
  }

  private reconcile(input: ReconcileInput): ReconcileOutput {
    const { binding, incoming, previousView, local, requestStartRevision } = input
    const collection = binding.metadata.source
    const namespace = this.collectionNamespace(collection)
    const localRevision = input.mutationRevision ?? this.collectionRevisions.get(namespace) ?? 0

    const existing = new Map(input.existing)
    for (const id of new Set([...incoming.ids, ...(previousView?.ids ?? [])])) {
      const cached = this.entityCache.get(this.entityCacheKey(collection, id))
      if (cached) existing.set(idToken(id), cached)
    }

    const records: EntityRecord[] = []
    const changedEntityKeys = new Set<string>()

    for (const entity of incoming.entities) {
      const token = idToken(entity.id)
      const current = existing.get(token)
      const protectLocal =
        !local &&
        requestStartRevision !== undefined &&
        current !== undefined &&
        current.localRevision > requestStartRevision
      const nextValue = protectLocal
        ? current.value
        : mergeEntity(collection, current?.value, entity)
      const nextLocalRevision =
        local && input.dirtyIds.has(token) ? localRevision : (current?.localRevision ?? 0)
      const record: EntityRecord = {
        key: entityStorageKey(this.scope, collection.key, collection.version, entity.id),
        scope: this.scope,
        collection: collection.key,
        version: collection.version,
        id: entity.id,
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
      requestStartRevision !== undefined &&
      previousView !== undefined &&
      previousView.localRevision > requestStartRevision

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
      ...binding.activeView!,
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
    collection: LocalCollection<LocalEntity>,
    records: EntityRecord[],
    source?: LocalResourceBinding
  ): void {
    if (records.length === 0) return
    for (const binding of this.bindings) {
      if (
        binding === source ||
        binding.metadata.source.key !== collection.key ||
        binding.metadata.source.version !== collection.version
      ) {
        continue
      }
      binding.applyEntities(records)
    }
    source?.applyEntities(records)
  }
}

type ActiveView = Omit<
  ViewRecord,
  'dataKind' | 'ids' | 'state' | 'fetchedAt' | 'lastAccessedAt' | 'cursorHistory' | 'localRevision'
>

export class LocalResourceBinding {
  activeView?: ActiveView
  private suppress = 0
  private pendingMutation = false
  private pendingMutationRevision = 0
  private readonly dirtyIds = new Set<string>()

  constructor(
    readonly manager: LocalManager,
    readonly metadata: LocalResourceMetadata,
    readonly resource: string,
    readonly state: ResourceDataLike,
    readonly runtime: ResourceRuntimeState,
    readonly descriptor: AnyResourceDescriptor
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

  activate(argKey: QueryCacheKey): void {
    const source = this.metadata.source
    const resource = this.metadata.key ?? this.resource
    this.activeView = {
      key: viewStorageKey(
        this.manager.scope,
        source.key,
        source.version,
        resource,
        this.descriptor.kind,
        argKey
      ),
      scope: this.manager.scope,
      collection: source.key,
      version: source.version,
      resource,
      kind: this.descriptor.kind as 'single' | 'infinite',
      argKey,
    }
  }

  activeEntry(): QueryCacheEntry | undefined {
    if (!this.runtime.activeKey) return undefined
    return this.runtime.cacheEntries.get(this.runtime.activeKey)
  }

  currentRevision(): number {
    return this.manager.revision(this.metadata.source)
  }

  async hydrate(): Promise<LocalHydratedView | undefined> {
    const hydrated = await this.manager.hydrate(this)
    if (!hydrated) return undefined
    return hydrated
  }

  async commitRemote(
    entry: QueryCacheEntry,
    fetchedAt: number,
    requestStartRevision: number
  ): Promise<void> {
    await this.manager.commitRemote(this, entry, fetchedAt, requestStartRevision)
  }

  syncActiveCache(): void {
    const entry = this.activeEntry()
    if (!entry) return
    entry.state = snapshot(this.state) as ResourceDataLike
  }

  applyView(view: ViewRecord, records: EntityRecord[]): void {
    this.runInternal(() => {
      this.state.data = hydrateData(view, records, this.metadata)
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
          const next = byId.get(idToken(item.id))
          return (next ?? item) as LocalEntity
        })
        this.state.data = this.metadata.map.join(rows, mapped.meta)
      } else if (Array.isArray(data)) {
        for (const item of data) {
          if (!isEntity(item)) continue
          const next = byId.get(idToken(item.id))
          if (next) Object.assign(item, next)
        }
      } else if (isEntity(data)) {
        const next = byId.get(idToken(data.id))
        if (next) Object.assign(data, next)
      }
    })
    this.syncActiveCache()
  }

  private onOperation(op: ProxyOp | undefined): void {
    if (this.suppress > 0 || !op || op[1][0] !== 'data') return
    for (const id of idsFromOp(op, this.state, this.metadata)) this.dirtyIds.add(id)
    if (this.pendingMutation) return
    this.pendingMutation = true
    this.pendingMutationRevision = this.manager.markLocalMutation(this.metadata.source)

    queueMicrotask(() => {
      this.pendingMutation = false
      const dirty = new Set(this.dirtyIds)
      const mutationRevision = this.pendingMutationRevision
      this.dirtyIds.clear()
      this.syncActiveCache()
      void this.manager.commitLocal(this, dirty, mutationRevision)
    })
  }
}

export function bindLocalResource(
  registry: LocalRegistryState | undefined,
  descriptor: AnyResourceDescriptor,
  path: string,
  state: ResourceDataLike,
  runtime: ResourceRuntimeState
): LocalResourceBinding | undefined {
  if (!registry) return undefined
  const metadata = getLocalResourceMetadata(descriptor)
  if (!metadata) return undefined

  const existing = registry.bindings.get(state)
  if (existing) return existing

  const binding = new LocalResourceBinding(
    registry.manager,
    metadata,
    path,
    state,
    runtime,
    descriptor
  )
  registry.bindings.set(state, binding)
  return binding
}
