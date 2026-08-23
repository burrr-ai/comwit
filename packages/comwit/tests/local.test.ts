import { IDBFactory } from 'fake-indexeddb'
import { local, model, query, silent } from '../src/core'
import { bindResourceState, createQueryBindingRegistry } from '../src/core/query'

type TodoEntity = {
  id: string
  title: string
  status: 'open' | 'done'
  updatedAt: number
  description?: string
}

type TodoListItem = Pick<TodoEntity, 'id' | 'title' | 'status' | 'updatedAt'>
type TodoDetail = TodoEntity & { description: string }

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function createTodoBound(options: {
  factory: IDBFactory
  database: string
  source: ReturnType<typeof local.collection<TodoEntity>>
  listFn?: (filter: { status: 'open' | 'done' }) => Promise<TodoListItem[]> | TodoListItem[]
  detailFn?: (id: string) => Promise<TodoDetail | null> | TodoDetail | null
  staleTime?: number
  scope?: string
  onError?: (error: unknown) => void
}) {
  const todoModel = model({
    list: local.query<TodoListItem[], { status: 'open' | 'done' }>({
      source: options.source,
      initialData: [],
      staleTime: options.staleTime,
      queryFn: options.listFn ?? (() => []),
    }),
    detail: local.query<TodoDetail | null, string>({
      source: options.source,
      initialData: null,
      staleTime: options.staleTime,
      queryFn: options.detailFn ?? (() => null),
    }),
  })
  const store = todoModel.instance()
  const registry = createQueryBindingRegistry({
    local: {
      indexedDB: options.factory,
      database: options.database,
      scope: options.scope,
      onError: options.onError ? (error) => options.onError?.(error) : undefined,
    },
  })
  const bound = bindResourceState(
    store.proxy,
    todoModel.pluginBags.get('query')!,
    undefined,
    registry,
    todoModel.key
  ) as any

  return { bound, registry }
}

describe('local()', () => {
  test('requires explicit stable collection identity and version', () => {
    expect(() => local.collection<TodoEntity>({ key: '', version: 1 })).toThrow('non-empty key')
    expect(() => local.collection<TodoEntity>({ key: 'todos', version: 0 })).toThrow(
      'positive integer'
    )
    expect(() => local.collection<TodoEntity>({ key: 'todos', version: 1, scope: ' ' })).toThrow(
      'scope must be non-empty'
    )

    const source = local.collection<TodoEntity>({ key: 'todos', version: 1 })
    expect(source.getId({ id: '1', title: 'Todo', status: 'open', updatedAt: 1 })).toBe('1')
    const legacy = local(query<TodoListItem[]>({ initialData: [], queryFn: () => [] }), {
      source,
    })
    expect(legacy.kind).toBe('single')
  })

  test('skips IndexedDB on the server and continues as an ordinary query', async () => {
    const source = local.collection<TodoEntity>({ key: 'todos', version: 1 })
    const queryFn = vi.fn(() => [
      { id: '1', title: 'Server only', status: 'open' as const, updatedAt: 1 },
    ])
    const todoModel = model({
      list: local.query<TodoListItem[]>({ source, initialData: [], queryFn }),
    })
    const store = todoModel.instance()
    const bound = bindResourceState(
      store.proxy,
      todoModel.pluginBags.get('query')!,
      undefined,
      createQueryBindingRegistry(),
      todoModel.key
    ) as any

    await bound.list.query()

    expect(queryFn).toHaveBeenCalledOnce()
    expect(bound.list.data[0].title).toBe('Server only')
    expect(bound.list.isSuccess).toBe(true)
    expect(bound.list.isError).toBe(false)
  })

  test('normalizes, fans out, and restores entities with a custom getId', async () => {
    type ExternalTodo = {
      uuid: string
      title: string
      description?: string
    }

    const factory = new IDBFactory()
    const database = `local-custom-id-${crypto.randomUUID()}`
    const source = local.collection<ExternalTodo>({
      key: 'external-todos',
      version: 1,
      getId: (todo) => todo.uuid,
    })

    const createBound = () => {
      const todoModel = model({
        list: local.query<ExternalTodo[]>({
          source,
          initialData: [],
          queryFn: () => [{ uuid: 'todo-1', title: 'List title' }],
          staleTime: 60_000,
        }),
        detail: local<ExternalTodo | null, string>({ source, initialData: null }),
      })
      const store = todoModel.instance()
      return bindResourceState(
        store.proxy,
        todoModel.pluginBags.get('query')!,
        undefined,
        createQueryBindingRegistry({ local: { indexedDB: factory, database } }),
        todoModel.key
      ) as any
    }

    const first = createBound()
    await first.list.query()
    first.detail.set(
      { uuid: 'todo-1', title: 'Detail title', description: 'Custom identity' },
      { arg: 'todo-1' }
    )

    await vi.waitFor(() => expect(first.list.data[0].title).toBe('Detail title'))

    const restored = createBound()
    await restored.detail.restore('todo-1')

    expect(restored.detail.data).toEqual({
      uuid: 'todo-1',
      title: 'Detail title',
      description: 'Custom identity',
    })
  })

  test('restores a standalone detail seeded by server initialization without an API query', async () => {
    const factory = new IDBFactory()
    const database = `local-standalone-${crypto.randomUUID()}`
    const source = local.collection<TodoEntity>({ key: 'todos', version: 1 })

    const createBound = () => {
      const todoModel = model({
        list: local.query<TodoListItem[], { status: 'open' | 'done' }>({
          source,
          initialData: [],
          staleTime: 60_000,
          queryFn: () => [{ id: '1', title: 'List title', status: 'open', updatedAt: 1 }],
        }),
        detail: local<TodoDetail | null, string>({
          source,
          initialData: null,
        }),
      })
      const store = todoModel.instance()
      const registry = createQueryBindingRegistry({
        local: { indexedDB: factory, database },
      })
      return bindResourceState(
        store.proxy,
        todoModel.pluginBags.get('query')!,
        undefined,
        registry,
        todoModel.key
      ) as any
    }

    const first = createBound()
    await first.list.query({ status: 'open' })

    silent(() => {
      first.detail.set(
        {
          id: '1',
          title: 'Server detail',
          status: 'open',
          updatedAt: 2,
          description: 'SEO response',
        },
        { arg: '1' }
      )
    })

    await vi.waitFor(() => expect(first.list.data[0].title).toBe('Server detail'))

    const restored = createBound()
    await restored.detail.restore('1')

    expect(restored.detail.data).toEqual({
      id: '1',
      title: 'Server detail',
      status: 'open',
      updatedAt: 2,
      description: 'SEO response',
    })
    expect(restored.detail.isSuccess).toBe(true)

    restored.detail.remove('1')
    expect(restored.detail.data).toBeNull()
  })

  test('lets a server initializer win over a pending standalone IndexedDB restore', async () => {
    const factory = new IDBFactory()
    const database = `local-standalone-race-${crypto.randomUUID()}`
    const source = local.collection<TodoEntity>({ key: 'todos', version: 1 })

    const createBound = () => {
      const todoModel = model({
        detail: local<TodoDetail | null, string>({ source, initialData: null }),
      })
      const store = todoModel.instance()
      return bindResourceState(
        store.proxy,
        todoModel.pluginBags.get('query')!,
        undefined,
        createQueryBindingRegistry({ local: { indexedDB: factory, database } }),
        todoModel.key
      ) as any
    }

    const seed = createBound()
    seed.detail.set(
      {
        id: '1',
        title: 'IndexedDB value',
        status: 'open',
        updatedAt: 1,
        description: 'Old',
      },
      { arg: '1' }
    )
    await new Promise((resolve) => setTimeout(resolve, 0))

    const next = createBound()
    const restoring = next.detail.restore('1')
    next.detail.set(
      {
        id: '1',
        title: 'Server value',
        status: 'open',
        updatedAt: 2,
        description: 'Fresh',
      },
      { arg: '1' }
    )
    await restoring

    expect(next.detail.data.title).toBe('Server value')
    expect(next.detail.data.description).toBe('Fresh')
  })

  test('hydrates an exact list argument from IndexedDB without refetching while fresh', async () => {
    const factory = new IDBFactory()
    const database = `local-hydrate-${crypto.randomUUID()}`
    const source = local.collection<TodoEntity>({ key: 'todos', version: 1 })
    const firstQuery = vi.fn(() => [
      { id: '1', title: 'Cached', status: 'open' as const, updatedAt: 1 },
    ])
    const first = createTodoBound({
      factory,
      database,
      source,
      listFn: firstQuery,
      staleTime: 60_000,
    })

    await first.bound.list.query({ status: 'open' })
    expect(firstQuery).toHaveBeenCalledOnce()

    const secondQuery = vi.fn(() => [
      { id: '1', title: 'Server', status: 'open' as const, updatedAt: 2 },
    ])
    const second = createTodoBound({
      factory,
      database,
      source,
      listFn: secondQuery,
      staleTime: 60_000,
    })

    await second.bound.list.query({ status: 'open' })

    expect(second.bound.list.data).toEqual([
      { id: '1', title: 'Cached', status: 'open', updatedAt: 1 },
    ])
    expect(second.bound.list.isSuccess).toBe(true)
    expect(secondQuery).not.toHaveBeenCalled()

    await second.bound.list.query({ status: 'done' })
    expect(secondQuery).toHaveBeenCalledOnce()
  })

  test('shows a stale durable snapshot while revalidating and atomically replaces it', async () => {
    const factory = new IDBFactory()
    const database = `local-revalidate-${crypto.randomUUID()}`
    const source = local.collection<TodoEntity>({ key: 'todos', version: 1 })
    const seed = createTodoBound({
      factory,
      database,
      source,
      staleTime: 0,
      listFn: () => [{ id: '1', title: 'Cached', status: 'open', updatedAt: 1 }],
    })
    await seed.bound.list.query({ status: 'open' })

    const request = deferred<TodoListItem[]>()
    const queryFn = vi.fn(() => request.promise)
    const next = createTodoBound({
      factory,
      database,
      source,
      staleTime: 0,
      listFn: queryFn,
    })

    const promise = next.bound.list.query({ status: 'open' })
    await vi.waitFor(() => expect(queryFn).toHaveBeenCalledOnce())

    expect(next.bound.list.data[0].title).toBe('Cached')
    expect(next.bound.list.isLoading).toBe(false)
    expect(next.bound.list.isFetching).toBe(true)

    request.resolve([{ id: '1', title: 'Fresh', status: 'open', updatedAt: 2 }])
    await promise

    expect(next.bound.list.data[0].title).toBe('Fresh')
    expect(next.bound.list.isFetching).toBe(false)
  })

  test('shares canonical fields between list and detail without dropping detail-only fields', async () => {
    const factory = new IDBFactory()
    const database = `local-list-detail-${crypto.randomUUID()}`
    const source = local.collection<TodoEntity>({ key: 'todos', version: 1 })
    const listFn = vi
      .fn()
      .mockResolvedValueOnce([{ id: '1', title: 'List title', status: 'open', updatedAt: 1 }])
      .mockResolvedValueOnce([{ id: '1', title: 'List refreshed', status: 'open', updatedAt: 3 }])
      .mockResolvedValueOnce([])
    const detailFn = vi.fn().mockResolvedValue({
      id: '1',
      title: 'Detail title',
      status: 'open',
      updatedAt: 2,
      description: 'Only the detail endpoint knows this',
    })
    const { bound } = createTodoBound({
      factory,
      database,
      source,
      listFn,
      detailFn,
      staleTime: 0,
    })

    await bound.list.query({ status: 'open' })
    await bound.detail.query('1')

    expect(bound.list.data[0].title).toBe('Detail title')
    expect(bound.detail.data.description).toBe('Only the detail endpoint knows this')

    await bound.list.refetch()

    expect(bound.detail.data.title).toBe('List refreshed')
    expect(bound.detail.data.description).toBe('Only the detail endpoint knows this')

    await bound.list.refetch()

    expect(bound.list.data).toEqual([])
    expect(bound.detail.data.title).toBe('List refreshed')
    expect(bound.detail.data.description).toBe('Only the detail endpoint knows this')
  })

  test('preserves canonical fields while a streamed revalidation is still in progress', async () => {
    const factory = new IDBFactory()
    const database = `local-stream-revalidate-${crypto.randomUUID()}`
    const source = local.collection<TodoEntity>({ key: 'todos', version: 1 })
    const continueStream = deferred<void>()
    const firstChunkApplied = deferred<void>()
    let requestCount = 0
    type TodoPage = { items: TodoListItem[]; total: number }

    async function* listFn() {
      requestCount++
      if (requestCount === 1) {
        yield {
          items: [{ id: '1', title: 'Initial', status: 'open' as const, updatedAt: 1 }],
          total: 1,
        }
        return
      }

      yield {
        items: [{ id: '1', title: 'Refreshed', status: 'open' as const, updatedAt: 3 }],
        total: 1,
      }
      firstChunkApplied.resolve()
      await continueStream.promise
    }

    const todoModel = model({
      list: local.query<TodoPage, { status: 'open' | 'done' }>({
        source,
        initialData: { items: [], total: 0 },
        staleTime: 0,
        queryFn: listFn,
        map: {
          split: (page) => ({ rows: page.items, meta: { total: page.total } }),
          join: (rows, meta) => ({ items: rows, total: meta?.total ?? 0 }),
        },
      }),
      detail: local.query<TodoDetail | null, string>({
        source,
        initialData: null,
        queryFn: () => ({
          id: '1',
          title: 'Detail',
          status: 'open' as const,
          updatedAt: 2,
          description: 'Only the detail endpoint knows this',
        }),
      }),
    })
    const store = todoModel.instance()
    const bound = bindResourceState(
      store.proxy,
      todoModel.pluginBags.get('query')!,
      undefined,
      createQueryBindingRegistry({ local: { indexedDB: factory, database } }),
      todoModel.key
    ) as any

    await bound.list.query({ status: 'open' })
    await bound.detail.query('1')

    const refetch = bound.list.refetch()
    await firstChunkApplied.promise

    expect(bound.list.data.items[0]).toEqual({
      id: '1',
      title: 'Refreshed',
      status: 'open',
      updatedAt: 3,
      description: 'Only the detail endpoint knows this',
    })
    expect(bound.list.data.total).toBe(1)
    expect(bound.list.isFetching).toBe(true)

    continueStream.resolve()
    await refetch
  })

  test('fans an optimistic entity edit out to loaded views and persists it', async () => {
    const factory = new IDBFactory()
    const database = `local-optimistic-${crypto.randomUUID()}`
    const source = local.collection<TodoEntity>({ key: 'todos', version: 1 })
    const first = createTodoBound({
      factory,
      database,
      source,
      staleTime: 60_000,
      listFn: () => [{ id: '1', title: 'Before', status: 'open', updatedAt: 1 }],
      detailFn: () => ({
        id: '1',
        title: 'Before',
        status: 'open',
        updatedAt: 1,
        description: 'Detail',
      }),
    })
    await first.bound.list.query({ status: 'open' })
    await first.bound.detail.query('1')

    first.bound.detail.data.title = 'Optimistic'
    await vi.waitFor(() => expect(first.bound.list.data[0].title).toBe('Optimistic'))

    const secondQuery = vi.fn(() => [])
    const second = createTodoBound({
      factory,
      database,
      source,
      staleTime: 60_000,
      listFn: secondQuery,
    })
    await second.bound.list.query({ status: 'open' })

    expect(second.bound.list.data[0].title).toBe('Optimistic')
    expect(secondQuery).not.toHaveBeenCalled()
  })

  test('does not let an older in-flight response overwrite a newer local edit', async () => {
    const factory = new IDBFactory()
    const database = `local-race-${crypto.randomUUID()}`
    const source = local.collection<TodoEntity>({ key: 'todos', version: 1 })
    const request = deferred<TodoListItem[]>()
    const listFn = vi
      .fn()
      .mockResolvedValueOnce([{ id: '1', title: 'Before', status: 'open', updatedAt: 1 }])
      .mockReturnValueOnce(request.promise)
    const { bound } = createTodoBound({
      factory,
      database,
      source,
      staleTime: 0,
      listFn,
    })

    await bound.list.query({ status: 'open' })
    const refetch = bound.list.refetch()
    bound.list.data[0].title = 'Optimistic'
    await Promise.resolve()

    request.resolve([{ id: '1', title: 'Old server value', status: 'open', updatedAt: 1 }])
    await refetch

    expect(bound.list.data[0].title).toBe('Optimistic')
  })

  test('keeps a draft protected across revalidations started after the local edit', async () => {
    const factory = new IDBFactory()
    const database = `local-draft-${crypto.randomUUID()}`
    const source = local.collection<TodoEntity>({ key: 'todos', version: 1 })
    const listFn = vi
      .fn()
      .mockResolvedValueOnce([{ id: '1', title: 'Before', status: 'open', updatedAt: 1 }])
      .mockResolvedValueOnce([
        { id: '1', title: 'Stale revalidation', status: 'open', updatedAt: 1 },
      ])
      .mockResolvedValueOnce([
        { id: '1', title: 'Remote after commit', status: 'open', updatedAt: 3 },
      ])
    const { bound } = createTodoBound({
      factory,
      database,
      source,
      staleTime: 0,
      listFn,
    })

    await bound.list.query({ status: 'open' })
    const draft = bound.list.draft()
    draft[0].title = 'Optimistic'
    await Promise.resolve()

    expect(bound.list.isDirty).toBe(true)
    await bound.list.refetch()
    expect(bound.list.data[0].title).toBe('Optimistic')
    expect(bound.list.isDirty).toBe(true)

    bound.list.commitDraft([{ id: '1', title: 'Confirmed', status: 'open', updatedAt: 2 }])
    expect(bound.list.data[0].title).toBe('Confirmed')
    expect(bound.list.isDirty).toBe(false)

    await bound.list.refetch()
    expect(bound.list.data[0].title).toBe('Remote after commit')
  })

  test('scopes drafts by argument view and can discard to the captured baseline', async () => {
    const factory = new IDBFactory()
    const database = `local-draft-view-${crypto.randomUUID()}`
    const source = local.collection<TodoEntity>({ key: 'todos', version: 1 })
    const listFn = vi.fn(({ status }: { status: 'open' | 'done' }) => [
      {
        id: status,
        title: status === 'open' ? 'Remote open' : 'Remote done',
        status,
        updatedAt: 1,
      },
    ])
    const { bound } = createTodoBound({
      factory,
      database,
      source,
      staleTime: 0,
      listFn,
    })

    await bound.list.query({ status: 'open' })
    bound.list.draft([{ id: 'open', title: 'Draft open', status: 'open', updatedAt: 1 }])

    await bound.list.query({ status: 'done' })
    expect(bound.list.data[0].title).toBe('Remote done')
    expect(bound.list.isDirty).toBe(false)

    await bound.list.query({ status: 'open' }, { force: true })
    expect(bound.list.isDirty).toBe(true)
    expect(bound.list.data[0].title).toBe('Draft open')

    bound.list.discardDraft()
    expect(bound.list.data[0].title).toBe('Remote open')
    expect(bound.list.isDirty).toBe(false)
  })

  test('does not let an older in-flight response restore locally removed membership', async () => {
    const factory = new IDBFactory()
    const database = `local-membership-race-${crypto.randomUUID()}`
    const source = local.collection<TodoEntity>({ key: 'todos', version: 1 })
    const request = deferred<TodoListItem[]>()
    const listFn = vi
      .fn()
      .mockResolvedValueOnce([{ id: '1', title: 'Before', status: 'open', updatedAt: 1 }])
      .mockReturnValueOnce(request.promise)
    const first = createTodoBound({
      factory,
      database,
      source,
      staleTime: 0,
      listFn,
    })

    await first.bound.list.query({ status: 'open' })
    const refetch = first.bound.list.refetch()
    first.bound.list.data.splice(0, 1)
    await Promise.resolve()

    request.resolve([{ id: '1', title: 'Old server value', status: 'open', updatedAt: 1 }])
    await refetch

    expect(first.bound.list.data).toEqual([])

    const restoreQuery = vi.fn(() => [
      { id: '1', title: 'Server', status: 'open' as const, updatedAt: 2 },
    ])
    const restored = createTodoBound({
      factory,
      database,
      source,
      staleTime: 60_000,
      listFn: restoreQuery,
    })
    await restored.bound.list.query({ status: 'open' })

    expect(restored.bound.list.data).toEqual([])
    expect(restoreQuery).not.toHaveBeenCalled()
  })

  test('retains hydrated data when background revalidation fails', async () => {
    const factory = new IDBFactory()
    const database = `local-error-${crypto.randomUUID()}`
    const source = local.collection<TodoEntity>({ key: 'todos', version: 1 })
    const seed = createTodoBound({
      factory,
      database,
      source,
      staleTime: 0,
      listFn: () => [{ id: '1', title: 'Cached', status: 'open', updatedAt: 1 }],
    })
    await seed.bound.list.query({ status: 'open' })

    const next = createTodoBound({
      factory,
      database,
      source,
      staleTime: 0,
      listFn: () => Promise.reject(new Error('Offline')),
    })

    await expect(next.bound.list.query({ status: 'open' })).rejects.toThrow('Offline')
    expect(next.bound.list.data[0].title).toBe('Cached')
    expect(next.bound.list.isSuccess).toBe(true)
    expect(next.bound.list.isError).toBe(true)
  })

  test('treats a collection version change and provider scope change as cache misses', async () => {
    const factory = new IDBFactory()
    const database = `local-version-scope-${crypto.randomUUID()}`
    const v1 = local.collection<TodoEntity>({ key: 'todos', version: 1 })
    const seed = createTodoBound({
      factory,
      database,
      source: v1,
      scope: 'user:1',
      staleTime: 60_000,
      listFn: () => [{ id: '1', title: 'V1', status: 'open', updatedAt: 1 }],
    })
    await seed.bound.list.query({ status: 'open' })

    const v2Query = vi.fn(() => [{ id: '1', title: 'V2', status: 'open' as const, updatedAt: 2 }])
    const v2 = createTodoBound({
      factory,
      database,
      source: local.collection<TodoEntity>({ key: 'todos', version: 2 }),
      scope: 'user:1',
      staleTime: 60_000,
      listFn: v2Query,
    })
    await v2.bound.list.query({ status: 'open' })
    expect(v2Query).toHaveBeenCalledOnce()

    const otherUserQuery = vi.fn(() => [
      { id: '1', title: 'Other user', status: 'open' as const, updatedAt: 1 },
    ])
    const otherUser = createTodoBound({
      factory,
      database,
      source: v1,
      scope: 'user:2',
      staleTime: 60_000,
      listFn: otherUserQuery,
    })
    await otherUser.bound.list.query({ status: 'open' })
    expect(otherUserQuery).toHaveBeenCalledOnce()
  })

  test('lets a collection override provider scope for shared public data', async () => {
    const factory = new IDBFactory()
    const database = `local-public-scope-${crypto.randomUUID()}`
    const source = local.collection<TodoEntity>({
      key: 'public-todos',
      version: 1,
      scope: 'public',
    })
    const seedQuery = vi.fn(() => [
      { id: '1', title: 'Shared', status: 'open' as const, updatedAt: 1 },
    ])
    const seed = createTodoBound({
      factory,
      database,
      source,
      scope: 'user:1',
      staleTime: 60_000,
      listFn: seedQuery,
    })
    await seed.bound.list.query({ status: 'open' })

    const restoreQuery = vi.fn(() => [
      { id: '1', title: 'Remote', status: 'open' as const, updatedAt: 2 },
    ])
    const restored = createTodoBound({
      factory,
      database,
      source,
      scope: 'user:2',
      staleTime: 60_000,
      listFn: restoreQuery,
    })
    await restored.bound.list.query({ status: 'open' })

    expect(seedQuery).toHaveBeenCalledOnce()
    expect(restoreQuery).not.toHaveBeenCalled()
    expect(restored.bound.list.data[0].title).toBe('Shared')
  })

  test('resolves collection scope lazily from another provider-bound model', async () => {
    const factory = new IDBFactory()
    const database = `local-model-scope-${crypto.randomUUID()}`
    const identityModel = model<{ me: { id: string } | null }>({ me: null })
    let scopeEvaluations = 0
    const source = local.collection<TodoEntity>({
      key: 'model-scoped-todos',
      version: 1,
      scope: ({ state }) => {
        scopeEvaluations++
        const id = state(identityModel).me?.id
        return id ? `user:${id}` : null
      },
    })

    expect(scopeEvaluations).toBe(0)

    const createBound = (userId: string | null, listFn: () => TodoListItem[]) => {
      const identityStore = identityModel.instance()
      identityStore.proxy.me = userId ? { id: userId } : null
      const todoModel = model({
        list: local.query<TodoListItem[]>({
          source,
          initialData: [],
          staleTime: 60_000,
          queryFn: listFn,
        }),
      })
      const store = todoModel.instance()
      const registry = createQueryBindingRegistry({
        local: { indexedDB: factory, database, scope: 'provider-default' },
      })
      registry.getModelState = (sourceModel) => {
        if (sourceModel !== identityModel) throw new Error('Unexpected scope model')
        return identityStore.proxy
      }
      const bound = bindResourceState(
        store.proxy,
        todoModel.pluginBags.get('query')!,
        undefined,
        registry,
        todoModel.key
      ) as any
      return bound
    }

    const unresolvedQuery = vi.fn(() => [
      { id: '1', title: 'Unscoped', status: 'open' as const, updatedAt: 1 },
    ])
    await createBound(null, unresolvedQuery).list.query()
    expect(unresolvedQuery).toHaveBeenCalledOnce()
    expect(scopeEvaluations).toBeGreaterThan(0)

    const seedQuery = vi.fn(() => [
      { id: '1', title: 'User one', status: 'open' as const, updatedAt: 2 },
    ])
    await createBound('1', seedQuery).list.query()

    const restoreQuery = vi.fn(() => [
      { id: '1', title: 'Remote one', status: 'open' as const, updatedAt: 3 },
    ])
    const restored = createBound('1', restoreQuery)
    await restored.list.query()
    expect(restoreQuery).not.toHaveBeenCalled()
    expect(restored.list.data[0].title).toBe('User one')

    const userTwoQuery = vi.fn(() => [
      { id: '1', title: 'User two', status: 'open' as const, updatedAt: 1 },
    ])
    const userTwo = createBound('2', userTwoQuery)
    await userTwo.list.query()
    expect(userTwoQuery).toHaveBeenCalledOnce()
    expect(userTwo.list.data[0].title).toBe('User two')
  })

  test('drops an in-flight result when its model-derived scope changes', async () => {
    const factory = new IDBFactory()
    const database = `local-scope-race-${crypto.randomUUID()}`
    const identityModel = model<{ me: { id: string } | null }>({ me: null })
    const identityStore = identityModel.instance()
    identityStore.proxy.me = { id: '1' }
    const source = local.collection<TodoEntity>({
      key: 'scope-race-todos',
      version: 1,
      scope: ({ state }) => {
        const id = state(identityModel).me?.id
        return id ? `user:${id}` : null
      },
    })
    const pending = deferred<TodoListItem[]>()
    const listFn = vi
      .fn<() => Promise<TodoListItem[]>>()
      .mockResolvedValueOnce([
        { id: '1', title: 'User one', status: 'open' as const, updatedAt: 1 },
      ])
      .mockImplementationOnce(() => pending.promise)
    const todoModel = model({
      list: local.query<TodoListItem[]>({
        source,
        initialData: [],
        queryFn: listFn,
      }),
    })
    const store = todoModel.instance()
    const registry = createQueryBindingRegistry({ local: { indexedDB: factory, database } })
    registry.getModelState = () => identityStore.proxy
    const bound = bindResourceState(
      store.proxy,
      todoModel.pluginBags.get('query')!,
      undefined,
      registry,
      todoModel.key
    ) as any

    await bound.list.query()
    const request = bound.list.query({ force: true })
    identityStore.proxy.me = { id: '2' }
    pending.resolve([{ id: '1', title: 'Late user one', status: 'open' as const, updatedAt: 2 }])
    await request

    expect(bound.list.data).toEqual([])
    expect(bound.list.isSuccess).toBe(false)

    const userTwoQuery = vi.fn(() => [
      { id: '1', title: 'Fresh user two', status: 'open' as const, updatedAt: 1 },
    ])
    const userTwoModel = model({
      list: local.query<TodoListItem[]>({
        source,
        initialData: [],
        staleTime: 60_000,
        queryFn: userTwoQuery,
      }),
    })
    const userTwoStore = userTwoModel.instance()
    const userTwoRegistry = createQueryBindingRegistry({
      local: { indexedDB: factory, database },
    })
    userTwoRegistry.getModelState = () => identityStore.proxy
    const userTwo = bindResourceState(
      userTwoStore.proxy,
      userTwoModel.pluginBags.get('query')!,
      undefined,
      userTwoRegistry,
      userTwoModel.key
    ) as any

    await userTwo.list.query()
    expect(userTwoQuery).toHaveBeenCalledOnce()
    expect(userTwo.list.data[0].title).toBe('Fresh user two')
  })

  test('normalizes and restores response envelopes with map.split/join', async () => {
    const factory = new IDBFactory()
    const database = `local-envelope-${crypto.randomUUID()}`
    const source = local.collection<TodoEntity>({ key: 'todos', version: 1 })
    type TodoPage = { items: TodoListItem[]; total: number }

    const createPageBound = (listFn: () => Promise<TodoPage> | TodoPage, detailFn: () => any) => {
      const pageModel = model({
        page: local.query<TodoPage>({
          source,
          initialData: { items: [], total: 0 },
          staleTime: 60_000,
          queryFn: listFn,
          map: {
            split: (page) => ({ rows: page.items, meta: { total: page.total } }),
            join: (rows, meta) => ({
              items: rows,
              total: meta?.total ?? 0,
            }),
          },
        }),
        detail: local.query<TodoDetail | null, string>({
          source,
          initialData: null,
          queryFn: detailFn,
        }),
      })
      const store = pageModel.instance()
      const registry = createQueryBindingRegistry({
        local: { indexedDB: factory, database },
      })
      return bindResourceState(
        store.proxy,
        pageModel.pluginBags.get('query')!,
        undefined,
        registry,
        pageModel.key
      ) as any
    }

    const first = createPageBound(
      () => ({
        items: [{ id: '1', title: 'Summary', status: 'open', updatedAt: 1 }],
        total: 42,
      }),
      () => ({
        id: '1',
        title: 'Detail title',
        status: 'open',
        updatedAt: 2,
        description: 'Detail',
      })
    )
    await first.page.query()
    await first.detail.query('1')

    expect(first.page.data).toEqual({
      items: [expect.objectContaining({ id: '1', title: 'Detail title' })],
      total: 42,
    })

    const queryFn = vi.fn()
    const second = createPageBound(queryFn, () => null)
    await second.page.query()

    expect(second.page.data.items[0].title).toBe('Detail title')
    expect(second.page.data.total).toBe(42)
    expect(queryFn).not.toHaveBeenCalled()
  })

  test('restores infinite data and cursor metadata from a durable view', async () => {
    const factory = new IDBFactory()
    const database = `local-infinite-${crypto.randomUUID()}`
    const source = local.collection<TodoEntity>({ key: 'todos', version: 1 })

    const createFeed = (queryFn: () => any) => {
      const feedModel = model({
        feed: local.infinite<TodoListItem[]>({
          source,
          initialData: [],
          staleTime: 60_000,
          queryFn,
        }),
      })
      const store = feedModel.instance()
      const registry = createQueryBindingRegistry({
        local: { indexedDB: factory, database },
      })
      return bindResourceState(
        store.proxy,
        feedModel.pluginBags.get('query')!,
        undefined,
        registry,
        feedModel.key
      ) as any
    }

    const first = createFeed(() => ({
      data: [{ id: '1', title: 'Page one', status: 'open', updatedAt: 1 }],
      cursor: 'next',
      hasMore: true,
    }))
    await first.feed.query()

    const secondQuery = vi.fn()
    const second = createFeed(secondQuery)
    await second.feed.query()

    expect(second.feed.data[0].title).toBe('Page one')
    expect(second.feed.cursor).toBe('next')
    expect(second.feed.hasMore).toBe(true)
    expect(secondQuery).not.toHaveBeenCalled()
  })
})
