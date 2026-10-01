# State Layer

## Location
`services/{service}/state/{domain}/`

## @comwit/state additional APIs & detailed syntax

This document only covers frequently used `@comwit/state` patterns. The library has many other APIs.

- `persist()` — auto-sync model fields to localStorage/sessionStorage (login tokens, theme, recently viewed items, etc.)
- `query.realtime()` — realtime subscription
- `searchParam()` — typed URL query fields declared inside `model()` (requires `@comwit/state@2.4.0`)
- `slowLoadingMs` / `isSlowLoading` — mark an initial query that remains pending beyond a threshold (requires `@comwit/state@2.4.0`)
- `derive` — read-only computed fields derived from other fields
- `rules` — per-field validation (accessed via `state.$validation`)
- `@Retry()` — retry on failure (supports exponential backoff)
- `@Queue()` — concurrency control (drop / queue / replace)
- `@Log()`, `@Validate()` — logging / argument validation

Check the usage, options, and signatures of these APIs at https://library.comwit.io/llms.txt .

## Structure

```
state/product/
  ├── types.ts          # State + Actions types
  ├── model.ts          # model() with initial state
  ├── actions/
  │     ├── load.ts     # imperative refresh/preload/coordinated queries
  │     ├── crud.ts     # create, update, delete
  │     └── interact.ts # like, bookmark, etc.
  └── index.ts          # create() hook + re-exports
```

**Write types.ts first.** Write order: types.ts → model.ts → actions/\*.ts → index.ts

## Common rules

- Manage list + detail + stats together in the model — on CRUD do an optimistic update + refetch all related queries (list, stats, etc.)
- Define all side effects inside actions (do not expose them to UI components)
  - Call `toast` (`@/lib/components/ui/toast`), `popup.confirm` / `popup.alert` (`@/lib/popup`), etc. inside the action
  - When another model's state is needed, do not receive it as an argument in the action; instead cross-state-model import it internally via state
  - Actions should take as few arguments as possible and manage things via internal state (so callers don't need to know much)
- Re-export api types or define them additionally
- Dependency flow: `page → state → api → repository`
- Store SSR-owned resources in a `Query` when they need a client cache. A Server Component resolves the data, then a small client route adapter seeds that query with `.hydrate()` before the first normal domain-hook read.
- Use `Query` for client `.load()`, refetching, argument-keyed caching, SSR hydration, loading/error state, infinite loading, or realtime behavior.
- Use a selector for every domain hook call. Calling a domain hook without a selector observes the whole model.
- Always select the complete action collection as `actions: state.actions`. Never select one method with `state.actions.init` or alias individual action methods inside a selector. Actions are proxy-backed, and partial selection can trigger a Proxy invariant Runtime TypeError.
- When a view owns the initial query, start it explicitly with `state.queryField.load(arg)` inside the selector. Do not call an initial-load action from `useEffect`.
- Basic app/admin auth is server-owned: await `getMe()` in the service layout below `<Suspense fallback={null}>`, then hydrate the user query in the client adapter before consumers render. Never bootstrap basic auth from `useEffect` or selector `.load()`.
- Select a query field without `.load()` only when SSR hydration or an action intentionally owns loading.
- Domain-data Suspense fallbacks are simple skeletons. Query reads belong in the resolved/client-loaded view. The service-root auth boundary uses `fallback={null}`.

## types.ts

Define State + Actions types. Use `Query<TData, TArg>` to type query fields.

```ts
import type { Query } from '@comwit/state'

export type ProductStats = {
  totalCount: number
  pendingCount: number
  activeCount: number
}

export type ProductState = {
  products: Query<Pageable<Product>, { page: number }>
  stats: Query<ProductStats>
  detail: Query<Product | null, string>
  // Regular data — local state, not a query
  selectedIds: string[]
  isEditMode: boolean
}

export type ProductActions = {
  refreshAll(): Promise<void>
  create(title: string): Promise<void>
  delete(id: string): Promise<void>
  like(): Promise<void>
  openDetail(id: string): void
  // Regular data manipulation
  toggleSelect(id: string): void
  clearSelection(): void
  setEditMode(value: boolean): void
}
```

## model.ts

- Two types of query: `query<TData, TArg>()` (regular), `query.infinite<TData, TArg>()` (infinite scroll)
- `keepPreviousData`: only used in pagination queries

```ts
import { keepPreviousData, model, query } from '@comwit/state'

export const product = model<ProductState>({
  // query data — fetched from the server
  products: query<Pageable<Product>, { page: number }>({
    initialData: { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
    queryFn: ({ page }) => api.product.findAll({ page, limit: 20 }),
    placeholderData: keepPreviousData,  // only used in pagination
    slowLoadingMs: 500, // optional UI threshold; does not delay the request
  }),
  stats: query<ProductStats>({
    initialData: { totalCount: 0, pendingCount: 0, activeCount: 0 },
    queryFn: () => api.product.getStats(),
  }),
  // SSR-owned detail — seed through useProduct.hydrate() in a route adapter
  detail: query<Product | null, string>({
    initialData: null,
    queryFn: (slug) => api.product.findById(slug),
  }),
  // Regular data — local state, manipulated directly in actions
  selectedIds: [],
  isEditMode: false,
})

// query.infinite — infinite scroll
export const feed = model<FeedState>({
  posts: query.infinite<Post[]>({
    initialData: [],
    queryFn: async (_, { state }) => {
      const page = state.cursor ? Number(state.cursor) : 1
      const res = await api.feed.findAll({ page, limit: 20 })
      return { data: res.items, cursor: String(page + 1), hasMore: page < res.totalPages }
    },
  }),
})
```

Selector method (UI only): `.load(arg?)`

Action methods: `.query(arg?, options?)` · `.refetch()` · `.nextFetch()` · `.previousFetch()`
Query data: `data` · `isLoading` · `isSlowLoading` · `isFetching` · `isSuccess` · `isError` · `error` · `hasMore` · `cursor`

```ts
// action — infinite query loadMore
async loadMore() {
  await this.model.posts.nextFetch()
}
```

## actions/

- All side effects go in Actions — UI handlers only call a single action
- Confirmation: use `popup.confirm()` (`@/lib/popup`)

### SSR hydration — route adapter

- Await server data in a Server Component and pass the resolved seed only to a small Client Component route adapter.
- Call the domain hook's `.hydrate()` unconditionally in a small adapter; normal domain-hook reads belong in children. Keep the adapter free of subscriptions to that model, including action selectors and account-change effects. A model mutation must not rerender the adapter and replay its old server seed (especially after sign-out).
- Do not use `useEffect`, actions, public proxy mutation, or `silent()` during render.
- `.hydrate()` accepts `null` / `undefined` as a no-op, never calls `queryFn`, and ignores equivalent repeated seeds. It initializes a successful query entry and keeps abandoned transitions from replacing the visible route.

```tsx
// product-detail-route.tsx — Client Component
'use client'

function ProductDetailRoute({ slug, initialProduct }: Props) {
  useProduct.hydrate({ detail: { arg: slug, data: initialProduct } })
  return <ProductDetail />
}

function ProductDetail() {
  const detail = useProduct((state) => state.detail.data)
  if (!detail) return <NotFound />
  return <ProductView product={detail} />
}
```

### Basic auth and lazy separate-table data

`UserState.me` is `Query<User | null>`. The service layout awaits `getMe()`
(Better Auth session/user fields only) below `<Suspense fallback={null}>` and
passes its resolved result to the client adapter:

```tsx
function AppLayoutClient({ children, initialUser }: Props) {
  useUser.hydrate({ me: { data: initialUser } })
  return <>{children}</>
}
```

Hydrate is synchronous; await the API on the server, not this hook. Always pass
`{ me: { data: null } }` for a confirmed anonymous session: `hydrate(null)` is a
no-op. Consumers read `state.me.data` without `.load()`. Session-read errors
propagate to an error boundary, never become anonymous. Use `me.set(userOrNull)`
in interactive auth actions, and `me.data` in cross-domain login checks.

Keep Better Auth's existing session-cookie cache and its session recheck when
that cache is missing or expired. Do not bypass it with ordinary
`disableCookieCache: true` calls or treat a cookie-cache miss as anonymous.
Admin retains its DB-authoritative session policy.

Prefer client loading only where needed for separate member/profile/business
tables. Keep this extra data out of `getMe`, `User`, the auth cookie/cache,
`customSession`, and the auth layout await. For example, use a separate model:

```ts
export const member = model<MemberState>({
  // MemberState.profile: Query<MemberProfile | null, string>
  profile: query<MemberProfile | null, string>({
    initialData: null,
    // userId keys the client cache; the API derives/authorizes its user itself.
    queryFn: () => api.member.getProfile(),
  }),
})
```

```tsx
function MemberPanel() {
  const user = useUser((state) => ({ me: state.me.data }))
  const member = useMember((state) => ({
    profile: user.me ? state.profile.load(user.me.id) : state.profile,
  }))

  if (!user.me) return null
  if (member.profile.isError) return <ProfileError />
  if (!member.profile.isSuccess) return null
  return <MemberProfileView profile={member.profile.data} />
}
```

Use a per-user query key (and clear private caches on sign-out if retained by the
model). Do not use previous-account placeholder data. A missing profile row does
not change the authenticated user to `null`. Server guards and API authorization
remain authoritative; client state is for rendering.

### Query loading — selector `.load()` first

- When the view owns the initial request, call `.load(arg?)` directly in the domain-hook selector.
- `.load()` is selector-only. It starts the request after React commits, deduplicates the same key, and changes cache keys when its serialized argument changes.
- Merely selecting the query field is passive and never fetches.
- Do not wrap an initial query action in `useEffect`. Existing code may still work, but new code must use selector `.load()` when the view owns the request.

```tsx
function ProductList({ page }: { page: number }) {
  const product = useProduct((state) => ({
    products: state.products.load({ page }),
    stats: state.stats.load(),
    actions: state.actions,
  }))

  if (product.products.isError) return <ErrorMessage error={product.products.error} />
  if (product.products.isLoading) return <ProductsSkeleton />

  return <ProductsView products={product.products.data} stats={product.stats.data} />
}
```

Use passive selection only when another owner has already initialized or loaded the query:

```tsx
const product = useProduct((state) => ({
  products: state.products, // passive: SSR hydration or an action owns loading
  actions: state.actions,
}))
```

### Slow initial loading in 2.4.0

Set `slowLoadingMs` on `query()`, `query.infinite()`, `query.realtime()`,
`local.query()`, or `local.infinite()` when the UI should distinguish a slow
first load. `isSlowLoading` starts false and becomes true only if initial
loading continues past that many milliseconds. It clears on success, error,
or usable cached data. It does not delay the request or change `isLoading`.
An omitted threshold has no timer and keeps the flag false. Check the query
status before rendering data; `isSlowLoading: false` does not mean success.

```tsx
const products = useProduct((state) => state.products.load({ page }))
if (products.isError) return <ErrorMessage error={products.error} />
if (products.isLoading && !products.isSuccess) {
  return products.isSlowLoading ? <ProductsSkeleton /> : null
}
if (!products.isSuccess) return null
return <ProductsView products={products.data} />
```

### load.ts — imperative and coordinated queries

- Keep user-event refreshes, preloads, and coordinated requests in actions.
- Use `.query(arg?, options?)` for an imperative initial request and `.refetch()` for an active query that was already started by selector `.load()` or `.query()`.
- `.refetch()` is a no-op before an initial query has established an argument/cache key.
- Server Function transport serializes enumerable model Proxy values through the wire codec. Do not call `snapshot()` solely for API transport; reserve it for stable query keys, optimistic rollback, or another application-level fixed copy.

```ts
import { action } from '@comwit/state'

export const loadActions = action<Pick<ProductActions, 'refreshAll'>>(({ state }) => {
  class LoadActions {
    private model = state(product)

    async refreshAll() {
      await Promise.all([
        this.model.products.refetch(),
        this.model.stats.refetch(),
      ])
    }
  }
  return new LoadActions()
})
```

### Manipulating regular data — push, filter, direct assignment

Non-query fields are changed directly in actions. For arrays, `push`, `pop`, `splice`, and reassignment (`filter`, etc.) are all allowed.

```ts
export const selectActions = action<Pick<ProductActions, 'toggleSelect' | 'clearSelection' | 'setEditMode'>>(({ state }) => {
  class SelectActions {
    private model = state(product)

    toggleSelect(id: string) {
      const idx = this.model.selectedIds.indexOf(id)
      if (idx >= 0) {
        this.model.selectedIds.splice(idx, 1)   // remove
      } else {
        this.model.selectedIds.push(id)          // add
      }
    }

    clearSelection() {
      this.model.selectedIds = []                // reassign
    }

    setEditMode(value: boolean) {
      this.model.isEditMode = value              // simple assignment
    }
  }
  return new SelectActions()
})
```

### Typed URL state in 2.4.0

Use `searchParam()` for filters or selections that belong in the URL. Declare
the field in `model()` and read it through the ordinary domain hook. Action
assignments update the URL with `replace` history by default; use `history:
'push'` when the change should create a browser Back entry. Valid URL values
take priority over defaults. Missing or invalid values use `defaultValue`, or
`null` when no default is supplied. Unrelated query parameters and the hash
are preserved. The Provider manages the browser connection for observed URL
models; no extra URL hook is needed.

```ts
import { action, model, searchParam } from '@comwit/state'

export const filters = model({
  page: searchParam({ key: 'page', type: 'number', defaultValue: 1 }),
  archived: searchParam({ key: 'archived', type: 'boolean' }),
})

export const filterActions = action(({ state }) => ({
  setPage(page: number) {
    state(filters).page = page
  },
}))
```

For request-aware SSR, pass the optional synchronous
`getServerSearchParams?: () => string | null` to `ComwitProvider`; without it,
server and first hydration reads use defaults before the client reconciles the
URL. Advanced asynchronous updates can use `searchParam.getSnapshot()` and
`searchParam.set(..., { ifRevision })` to reject stale writes. URL state does not
fetch route data or validate domain IDs. See
https://library.comwit.io/docs/api/router for the complete 2.4.0 API.

### crud.ts — CRUD + popup.confirm

```ts
import { action, OnError } from '@comwit/state'
import { toast } from '@/lib/components/ui/toast'
import { popup } from '@/lib/popup'

export const crudActions = action<Pick<ProductActions, 'create' | 'delete'>>(({ state }) => {
  class CrudActions {
    private model = state(product)

    @OnError((error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Unexpected error')
    })
    async create(title: string) {
      // optimistic — immediately reflect stats counts
      this.model.stats.data.totalCount += 1
      this.model.stats.data.pendingCount += 1
      await api.product.create({ title })
      // refetch — refresh both list and stats
      await Promise.all([
        this.model.products.refetch(),
        this.model.stats.refetch(),
      ])
    }

    @OnError((error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Unexpected error')
    })
    async delete(id: string) {
      if (!await popup.confirm({ title: '삭제할까요?', description: '삭제하면 되돌릴 수 없어요.', destructive: true })) return
      // optimistic — remove from list + decrement stats counts
      const snapshot = { items: [...this.model.products.data.items], stats: { ...this.model.stats.data } }
      this.model.products.data.items = this.model.products.data.items.filter((p) => p.id !== id)
      this.model.stats.data.totalCount -= 1
      try {
        await api.product.delete(id)
        await Promise.all([
          this.model.products.refetch(),
          this.model.stats.refetch(),
        ])
      } catch {
        // rollback
        this.model.products.data.items = snapshot.items
        this.model.stats.data = snapshot.stats
        throw new Error('Failed to delete')
      }
    }
  }
  return new CrudActions()
})
```

### interact.ts — Cross-Domain Auth + List/Current synchronization

Read another domain's model with `state()`. Use `@Authorized` for the auth guard. Access the router via `context`.

```ts
export const interactActions = action<Pick<ProductActions, 'like' | 'openDetail'>, AppContext>(({ state, context }) => {
  class InteractActions {
    private model = state(product)
    private user = state(userModel)

    @Authorized({
      when: () => !!this.user.me.data,
      onDeny: () => context.router.push('/login'),
    })
    @OnError((error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Unexpected error')
    })
    async like() {
      // optimistic update — sync current + list
      this.model.currentProduct!.likeCount += 1
      this.model.currentProduct!.isLiked = true
      const item = this.model.products.data.items.find((p) => p.id === this.model.currentProduct!.id)
      if (item) { item.likeCount += 1; item.isLiked = true }
      await api.product.like(this.model.currentProduct!.id)
      await this.model.products.refetch()
    }

    openDetail(id: string) { context.router.push(`/product/${id}`) }
  }
  return new InteractActions()
})
```

## UI usage

- **When a view owns the query, call `.load()` in its selector and handle error/loading/data states in that order.**

```tsx
const product = useProduct((state) => ({
  products: state.products.load({ page }),
}))

if (product.products.isError) return <ErrorMessage error={product.products.error} />
if (product.products.isLoading) return <Skeleton />
return product.products.data.items.map((p) => <Card key={p.id} product={p} />)
```

## Decorators

| Decorator | Purpose |
|-----------|---------|
| `@OnError(fn)` | Side effects on error (the error propagates automatically; do not re-throw in the callback). Default: `toast.error()` |
| `@OnSuccess(fn)` | Success callback |
| `@Debounce(ms)` | Debounce |
| `@Throttle(ms)` | Throttle |
| `@Authorized({ when, onDeny })` | Auth guard |

### Reusable decorators — `intercept`

When you need to apply the same precondition (login required, permission check, common logging, etc.) repeatedly across multiple actions, build a custom decorator with `intercept`. It is meant to bundle things at the class level so you don't have to attach `@Authorized` to every method.

The `intercept` factory shares `state`/`context` access, so set up the state subscription once at declaration time and run the original method via `execute` on every call. You can attach it to the entire class (all methods) or to individual methods.

```ts
import { intercept } from '@comwit/state'
import { user } from '@/services/app/state/user/model'
import { popup } from '@/lib/popup'

// Login required — if not logged in, redirect to login page
const LoginRequired = intercept(({ state, context }) => {
  const u = state(user)
  return {
    intercept: (execute, args) => {
      if (!u.me.data) {
        context.router.push('/login')
        return   // execute not called → original method blocked
      }
      return execute(...args)   // pass args through as-is
    },
  }
})

// Shared delete confirmation — if the convention is that the first arg is an id, args can also be used
const ConfirmDelete = intercept(() => ({
  intercept: async (execute, args) => {
    if (!(await popup.confirm({ title: '삭제할까요?', description: '삭제하면 되돌릴 수 없어요.', destructive: true }))) return
    return execute(...args)
  },
}))
```

**Applying to the entire class** — every method goes through LoginRequired

```ts
@LoginRequired
class PostCrudActions {
  async create(title: string) { ... }
  async update(id: string, title: string) { ... }

  @ConfirmDelete   // class + method decorator combo — both must pass for execution
  async delete(id: string) { ... }
}
```

**Applying only to individual methods** — reads are open, only writes require login

```ts
class MixedActions {
  async readOnlyList() { ... }            // callable by anyone

  @LoginRequired
  async create(title: string) { ... }     // login required
}
```

- Class decorators and method decorators can be used together. Execution order is **outer (class) → inner (method)**.
- If `execute` is not called, the original method does not run (blocked by early return).
- Combine with existing `@OnError` for error handling — no need to handle toast inside intercept.
