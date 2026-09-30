# API Reference

## Location
`services/{service}/api/{domain}/`

## Structure
```
api/{domain}/
  ├── index.ts          # typed client
  ├── types.ts          # API method signatures
  └── actions/
      └── *.ts          # Other operations
```

## Rules
- **Domain = page fit**: API domains are not grouped around resources (tables), but around which screen they are used on. If the content needed by the frontend screen changes, the API response can also change. Multiple pages may share a domain, but in general we recommend grouping content that fits a main page into one domain.
- **Minimal args**: userId/session are fetched internally. They are not received as parameters. (After auth integration, `getServerSession` is imported from `@/server/auth/{service}`)
- **Server actions**: All methods are `'use server'` async functions
- **DB access**: Goes through `@/server/repository` (no direct DB access, no inline mock code)
  - Mock data is managed in `src/server/repository/_data/`. See the repository `.ai.md`.
- **Ownership check**: On queries like findAll, filter and return only resources owned by the currently logged-in user (public resources are an exception)
- **Frontend-friendly**: Shape API responses for the screen's UX, including display labels and formatted dates, so the UI can render them directly.
  ```typescript
  // raw data from repository
  { likeCount: 3, userId: 'abc' }
  // after transformation in api
  { likeCount: 3, isLikedByMe: true, displayCount: '3 items' }
  ```
- **Type safety**: Define `DomainAPI` interface in types.ts
- **findAll**: Second argument is `PageRequest`, response is `Pageable<T>` — import from `@/server/repository/types`
- **Timestamp**:
  - Input: KST string with an explicit `+09:00` offset → convert to UTC and pass to repository
  - Response: Format activity/created/updated timestamps in the API with `kstRelativeTime` from `@/lib/kst` (`30분 전`, `어제`); the UI renders the returned label. Reuse these shared formatters instead of duplicating formatting per domain or page.
  - Use `kstDate`/`kstDateTime` from the same module when exact dates matter (reservations, expiry, payments); keep raw timestamps separately only when needed for editing, sorting, or other logic.
  ```typescript
  import { kstDate, kstRelativeTime } from '@/lib/kst'

  // input (KST string → UTC)
  const utcDate = new Date('2026-07-20T15:00:00+09:00')
  // response (format in the API for direct display)
  const activityLabel = kstRelativeTime(utcDate)
  const reservationDate = kstDate(utcDate)
  ```


## Write order
1. **types.ts first** — define the API interface and response types while thinking about which screen will use them
2. actions/*.ts — implement the server action
3. index.ts — create the typed client

## types.ts

- Define API interface with JSDoc
- Define Resource types
  - List Item type suffix `Simple`
  - Detail Item type suffix `Detail`
  - Request type suffix `Request`

**Example:**
```typescript
import type { PageRequest, Pageable } from '@/server/repository/types'

export interface DomainAPI {
  /** Create an item */
  create: (request: CreateRequest) => Promise<void>

  /** List query — list always returns Pageable<T> */
  findAll: (filter: FindAllFilter, pageable: PageRequest) => Promise<Pageable<Simple>>

  /** Detail query */
  find: (id: string) => Promise<Detail>
}

export type FindAllFilter = {
  search?: string
}

export type Simple = {
  id: string
  name: string
}

export type Detail = Simple & {
  description: string
}

export type CreateRequest = {
  name: string
}
```

## actions/*.ts (Server Actions)

- `'use server'` required
- Every export must be wrapped with `createAction` (enforced by Oxlint `api-create-action`)
- Internal functions are declared with a `_` prefix and exported wrapped in `createAction`
- Keep `'use server'` as the source convention. The build loader replaces it with `import 'server-only'`, so the output is not registered or invoked as a native Next/React Server Function.
- Browser transport uses one dedicated POST Route Handler.
  - Every build removes action imports from API `index.ts` and emits a function-ID facade.
  - Server Components/RSC select the manifest-direct runtime through the package `react-server` condition.
  - Client Component SSR selects the client runtime and never starts a request during render.
  - Browsers use the client runtime and send POST requests.
  - Only the server manifest dynamically imports real action modules.
  - Endpoint: `POST /api/internal/server-fn/[...slug]`
- `createAction` returns the original `Promise<T>` function. The old one-item Promise tuple protocol is not used.

### Throw errors as `ActionError`

- Messages you want to show to the user **must** be thrown as `new ActionError("...")`
- A regular `new Error(...)` is masked by the Route Handler, so only a generic message reaches the client (forbidden by Oxlint `api-action-error`)
- Errors thrown by libraries or unexpected throws are logged and masked by the Route Handler

**Pattern:**
```typescript
'use server'

import { createAction, ActionError } from '@/lib/utils'

async function _create(request: CreateRequest): Promise<void> {
  if (!request.name) throw new ActionError('Name is required')
  // ...
}

export const create = createAction(_create)
```

## index.ts

- Wrap with `resolveActions()` and export (enforced by Oxlint `api-structure`)
- No individual function exports — export only as an object
- No type annotation (rely on inference)
- Direct re-export via `export { X } from './actions/...'` is forbidden
- Only the domain's `index.ts` may import action implementation files. Helpers, state, pages, and other APIs must use the domain index API object (enforced by `no-direct-api-action-import`).
- In source and tests, `resolveActions` is an identity marker. During a Next build, the index loader replaces it and all action imports with a conditional-runtime ID facade.
- The browser wire codec serializes enumerable values. Do not add API-transport-only `deproxy()`, `isProxy()`, or `snapshot()` handling; use `snapshot()` only when application logic needs a fixed local copy.

**Pattern:**
```typescript
import { resolveActions } from '@/lib/utils'

export * from './types'

import { create } from './actions/create'
import { find } from './actions/find'
import { findAll } from './actions/find-all'

export const domain = resolveActions({ create, find, findAll })
```

**Caller side:**
```typescript
// Single call — just await
const item = await domain.find(id)

// Parallel call — each function is an independent POST, so Promise.all runs them in parallel
const [items, stats] = await Promise.all([
  domain.findAll(filter, pageable),
  domain.getStats(),
])

// ActionError messages are restored from the HTTP response as regular Errors
// toast: import { toast } from '@/lib/components/ui/toast'
try {
  await domain.create(request)
} catch (e) {
  toast.error(e.message) // ActionError message, or the masked generic message
}
```
