---
name: auth-setup
description: Install Better Auth on Drizzle for one or more services. Triggers - "인증 설정", "로그인", "회원가입", "auth 추가". Requires a connected Drizzle database first.
---

# auth-setup

Set up per-service authentication using Better Auth with Drizzle ORM on the
project database. Each service (`app`, `admin`, `supplier`, …) gets its own
prefixed tables, cookies, base path, and auth instance.

Previously this skill tried to do heavy string templating inside a shell script. That proved fragile across macOS vs Linux `sed`. Now: the script does only the trivial shell work, and YOU (the AI) handle every file creation and edit, reading the `.ref` files in `assets/` as reference templates and substituting placeholders yourself.

## Preconditions

- A Drizzle database is connected. Verify
  `src/server/db/index.ts` and `drizzle.config.ts` exist and `.env` contains a
  non-empty `DATABASE_URL` (plus any driver token). They stay in the
  ignored/untracked `.env`; nothing is copied into tracked source. Never print
  a token.
- You know which services need auth. For a typical project: `app` (end users) and `admin` (operators).

## Naming conventions

Apply these consistently when substituting placeholders in the `.ref` files. Do the substitution yourself — do not try to drive it with `sed \U` or similar, since BSD sed (macOS) does not support case folding.

| Placeholder | Meaning | Example for `app` | Example for `admin` |
|---|---|---|---|
| `{service}` | lower-case service name | `app` | `admin` |
| `{Service}` | PascalCase, first letter upper | `App` | `Admin` |
| `{SERVICE}` | UPPER_SNAKE | `APP` | `ADMIN` |
| `{basePath}` | Better Auth base path for a non-admin service | `/app/api/auth` | Admin uses the constants below |
| `{homePath}` | post-authentication redirect expression | `"/"` | `adminRoutes.dashboard` |
| `{loginPath}` | post-signOut redirect expression | `"/login"` | `adminRoutes.login` |

For the admin service, read `ADMIN_BASE_PATH` from `src/lib/admin-routes.ts`
before writing code. If it is still exactly `/관리자` in a generated project,
initialize it using the one-time procedure in `src/services/admin/.ai.md` before continuing.

Admin auth deliberately splits its public and internal paths:

- Browser auth calls `ADMIN_AUTH_BASE_PATH`, derived from the project-specific
  public admin path (for example `/관리자-a1b2c3/api/auth`).
- The Better Auth server instance uses `INTERNAL_ADMIN_AUTH_BASE_PATH`
  (`/admin/api/auth`) so it matches the stable app-router filesystem path.
- The admin auth route normalizes the incoming public URL to the internal URL
  before passing the request to Better Auth.
- Direct external requests to `/admin` and every `/admin/*` subpath, including
  `/admin/api/auth`, must return 404. Never add a request-proxy exception for it.

## Steps

Repeat steps 1–6 for each target service. Steps 7–9 run once at the end.

### 1. Run the helper script

```bash
bash .agents/skills/auth-setup/scripts/setup.sh <service1> [service2] ...
```

This verifies the declared Better Auth/Drizzle packages, creates directories,
and prints a random 64-char hex secret per service. It does not install packages
or generate TS files. If verification fails, follow its exact `pnpm add`
instruction. Capture the printed secret(s) for step 2 without logging them
again.

### 2. Runtime environment and secret in `src/server/config.ts`

Before adding auth secrets, ensure `config` exposes `NODE_ENV`:

```ts
NODE_ENV: process.env.NODE_ENV ?? "production",
```

Add it only when the project does not already define `NODE_ENV`. The project
setup prompt writes `NODE_ENV=development` to the local `.env`; any other
value, including a missing value on the hosting platform, uses HTTPS. No site
URL environment variable is needed because the auth server detects the hosted
domain from the incoming request.

Then add one entry per service inside the `} as const;` block, using the secret
from step 1:

```ts
{SERVICE}_AUTH_SECRET: "<secret>",
```

Use `Edit`, not `sed`, so you can place it exactly before `} as const;`.

This is the one sanctioned exception to the no-credential-in-source rule
(AGENTS.md → Tech Stack & Rules → Env). The auth secret stays server-only in
`config.ts`; never print it again after capturing it from step 1, and do not
move it to deployment env or pass it through tool arguments.

### 3. Drizzle schema file

References:

- Non-admin services: `assets/auth-schema.ts.ref`.
- Admin: `assets/admin-auth-schema.ts.ref`. This includes the Better Auth admin
  plugin fields needed for server-only account provisioning.

Copy the applicable reference into
`src/server/db/plugin/auth/{service}-schema.ts`, replacing placeholders when
using the generic reference.

Critical:
- Do NOT keep any `import 'server-only'` line. drizzle-kit loads this file during `pnpm drizzle-kit generate/migrate` in a plain Node context; `server-only` makes it throw. The reference already omits it; keep it that way.
- Files under `src/server/db/plugin/**` are the only repository-layer files exempt from the `server-only` convention. Repository files that CONSUME these tables still import `server-only`.

### 4. Schema export

Append to `src/server/db/schema.ts`:

```ts
export * from "./plugin/auth/{service}-schema"
```

### 5. Auth server instance

References:

- Non-admin services: `assets/auth-server.ts.ref`.
- Admin: `assets/admin-auth-server.ts.ref`.

Copy the applicable reference into `src/server/auth/{service}.ts`. The generic
reference requires placeholder substitution and exports `get{Service}Auth` and
`get{Service}ServerSession`.

The admin reference already uses `INTERNAL_ADMIN_AUTH_BASE_PATH`, installs the
Better Auth admin plugin, and sets `emailAndPassword.disableSignUp: true`.
Preserve all three. This constant is server-internal only; do not give it to the
auth client or expose it as the user-facing endpoint. Never enable public admin
sign-up even temporarily. Keep the admin options declaration as
`satisfies BetterAuthOptions`; replacing it with a `BetterAuthOptions` type
annotation erases the inferred `auth.api.createUser` plugin method.

Critical:
- Keep the reference's `await connection()` (from `next/server`) as the first
  statement of `createAuth`. `betterAuth()` calls `Math.random()`, and with
  `cacheComponents` any route that reads the session (a landing page's
  signed-in redirect, the service layout) otherwise fails `next build` with
  "encountered the unstable value `Math.random()` while prerendering" and logs
  the same error in dev. Reading `headers()` first is not a reliable substitute.
- Keep the Better Auth instance request-scoped with React `cache(createAuth)`.
  Never use a module-level mutable `authInstance`; request-local auth state
  must not leak between warm serverless isolate requests. The shared database
  client itself is app-runtime scoped and may remain lazy and reusable.
- For non-admin services, preserve the reference's signed session cookie cache:
  `enabled: true`, `maxAge: 60 * 60`, `strategy: "compact"`, and
  `version: "1"`. Keep `nextCookies()` as the last Better Auth plugin so a
  Server Action can write refreshed session/cache cookies to the response.
  Also keep `get{Service}ServerSession` wrapped in React `cache()` to dedupe
  repeated reads within one server request.
- Do not copy `session.cookieCache` into the admin reference. Administrator
  session revocation and password changes remain DB-authoritative immediately;
  the admin helper only uses React request caching.
- Better Auth's Drizzle adapter looks up tables by the EXACT keys `user`, `session`, `account`, `verification`. Because our tables are prefixed (`{service}_auth__user`, etc.), the adapter must receive an explicit mapping. The reference already shows the correct shape:

  ```ts
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: {service}AuthUser,
      session: {service}AuthSession,
      account: {service}AuthAccount,
      verification: {service}AuthVerification,
    },
  }),
  ```

  Do NOT shortcut this with `import * as schema from "@/server/db/schema"` followed by `schema: schema`. At runtime Better Auth will throw `[# Drizzle Adapter]: The model "user" was not found in the schema object`.

### 6. Auth client + API route

For non-admin services:

- Reference `assets/auth-client.ts.ref` → copy to `src/lib/auth-client/{service}.ts`.
- Reference `assets/auth-route.ts.ref` → copy to `src/app/({service})/{service}/api/auth/[...all]/route.ts`.

For `admin`:

- Copy `assets/auth-client.ts.ref` to `src/lib/auth-client/admin.ts`, then
  import `ADMIN_AUTH_BASE_PATH` from `@/lib/admin-routes` and use that constant
  for the client's `basePath`.
- Copy `assets/admin-auth-route.ts.ref` to
  `src/app/(admin)/admin/api/auth/[...all]/route.ts`. Preserve its public-to-
  internal request normalization. Do not replace it with the generic route.

Preserve the admin mapping in `src/proxy.ts` as documented in
`src/services/admin/.ai.md`. The proxy rewrites both the public root and every
nested page/auth path, preserves the encoded suffix/query and POST body, and
returns an explicit 404 for direct internal requests. Do not move this mapping
back to `next.config.ts` afterFiles/wildcard rewrites: deployed RSC navigation
can resolve an app catch-all before those rules run. Keep admin auth requests
covered by the proxy matcher.

This keeps the browser on the project-specific admin prefix while the route
handler and Better Auth continue using the stable internal filesystem path.

Cookie compat note: `auth-server.ts` issues `SameSite=None; Secure` cookies so
the app works inside an HTTPS iframe (preview). Direct `http://localhost:3000`
access also works because modern browsers treat `localhost` as a secure context
and accept `Secure` cookies over plain HTTP. No per-request rewriting needed.

### 7. Replace mocks

If the project was scaffolded with mock state/auth files, swap them for the real ones:

- Non-admin `src/services/{service}/state/user/actions/auth.ts` ← reference
  `assets/auth-actions.ts.ref`
- Admin `src/services/admin/state/user/actions/auth.ts` ← reference
  `assets/admin-auth-actions.ts.ref`
- `src/services/{service}/api/user/actions/get-me.ts` ← reference `assets/get-me.ts.ref`

The generic references use `{service}Auth` / `get{Service}ServerSession` you
created in steps 5–6. Adapt the `User` shape and hook name if the state domain
uses a prefixed hook (e.g. `useAdminUser`).

The admin auth action reference deliberately has no `signUp` action. It uses
`adminRoutes.dashboard` / `adminRoutes.login` and connects
`adminAuth.changePassword` with `revokeOtherSessions: true`. Keep the template's
protected `adminRoutes.account` page and its navigation entry.

#### Resolve basic auth before rendering the service

The template already includes the boundary, async layout, query model, and
client hydration even before auth is installed. Replace the marked
`TODO(auth-setup)` mocks with real session reads and preserve this structure.
For a service without those files, use `assets/user-model.ts.ref`,
`assets/layout-server.tsx.ref`, and `assets/layout-client.tsx.ref`; adapt the
API object and hook names (`adminUser` / `useAdminUser` for admin). Preserve
existing UI and providers as children of the hydration adapter.

1. Keep a synchronous app-router service layout with
   `<Suspense fallback={null}>` **outside** the async service layout. Do not
   await before creating the boundary. The auth fallback stays `null`: no
   skeleton, spinner, anonymous shell, or state-aware fallback. The global root
   layout remains service-agnostic.
2. In `src/services/{service}/page/layout/index.tsx`, await the service API's
   `getMe()` and pass its resolved `User | null` to the client layout as
   `initialUser`. This suspends the shell and its children until basic auth is
   resolved. `getMe` only maps Better Auth's `session.user`: login status, id,
   name, email, image, and other needed fields owned by Better Auth.
3. Define `UserState.me` as `Query<User | null>` with `initialData: null` and
   `queryFn: () => userApi.getMe()`. `isLoading` is only for interactive auth
   actions. Remove the old `init` / `loadMe` actions and their types.
4. At the start of the client adapter, before any normal user-hook read, call
   `useUser.hydrate({ me: { data: initialUser } })` unconditionally. This is a
   synchronous client hook initializer; **await the server API, not hydrate**.
   Even for anonymous users pass `{ me: { data: null } }`; `hydrate(null)` is a
   no-op and would not seed the confirmed anonymous result. The adapter itself
   must not call the normal user hook (even just to select actions). Move user
   subscriptions, account-change effects, and interactive UI into children.
   Otherwise a query mutation can rerender the adapter and replay an old server
   seed after sign-out. `hydrate` followed by `useUser(...)` in the same component
   is not the layout pattern; check interactive sign-out as well as first render.
5. Consumers passively select `state.me.data` (or `state.me` for query status).
   Remove the mount-time `useEffect` bootstrap, ref guards, and initial
   `me.load()` calls. Login checks in cross-domain actions use `me.data`, not
   the always-truthy query object. Auth actions update the query with
   `this.model.me.set(userOrNull)`; never assign over the query itself. Keep
   navigation after real sign-in/sign-up/sign-out so the server resolves the
   updated session.
6. Propagate session errors to the error boundary. Only a successfully checked
   anonymous session returns `null`; never use `catch(() => null)` or silently
   render logged-out UI after a failed session read.

Keep `getMe` on `get{Service}ServerSession()` / Better Auth `getSession()`, so
non-admin reads use the existing one-hour signed cookie cache when valid and
Better Auth rechecks its session/user tables when the cache is absent or
expired. Do not replace this with a raw `getCookieCache()`-only read or add
`disableCookieCache: true` to ordinary `getMe` calls. Admin keeps its existing
DB-authoritative policy. Do not copy separate-table profile data into the auth
cookie cache or a `customSession` callback: fetch it only where needed on the
client, keeping the basic session read small and cacheable.

#### Lazy data from separate tables

Do **not** join a separate member/profile/business table in `getMe`, enrich
`User` with its data, or await it in the auth layout. A missing profile row does
not make a valid Better Auth session anonymous. Prefer client loading for those
resources through separate APIs and queries, and start their `.load()` only in
consuming views after a user is known. This keeps the initial session fast and
preserves Better Auth cookie-cache reuse. Follow `src/services/state.ai.md` for
an auth-dependent example.
Each API derives and authorizes the current user on the server; the client
query's user-id cache key is not authorization. Clear or separate per-user
query caches when the account changes. Server guards and API authorization
remain required regardless of the client hydration.

### 8. Migrate DB

```bash
pnpm drizzle-kit generate
```

Read every newly generated SQL migration, summarize tables, indexes, and any
destructive statements, and show the review to the user. Wait for explicit
confirmation before running the remote migration:

```bash
pnpm drizzle-kit migrate
```

Use `pnpm`, not `npx`. Approval to install auth is not blanket approval to apply
an unreviewed remote migration.

### 9. Record plugin metadata

```bash
npm pkg set cg.plugins.auth.createdAt="$(date -Iseconds)" cg.plugins.auth.provider="better-auth"
```

### 10. Restart dev server

```bash
pnpm run dev
```

For admin, verify the root, login, a protected nested page, and auth API on both
local and deployed runtimes. Check direct entry/refresh and Link/RSC navigation
(including prefetch); inspect actual route content, since an app catch-all can
return HTTP 200 with the wrong page. Direct internal `/admin/*` stays 404.

### 11. Give the user the admin entry URL

If admin auth was installed, read the actual `ADMIN_BASE_PATH` and follow
`src/services/admin/.ai.md` to tell the user the complete local URL and, when
known, deployed URL. There is no admin sign-up URL. Tell the user this is the
project's dedicated admin URL and ask them to bookmark it. If no administrator
exists, explain that they can explicitly ask the AI to set a login ID (email)
and password.

Create credentials only after the user explicitly provides both values. Use the
admin plugin's server API from a one-off server-only runner, without a request
or headers, so the public sign-up endpoint remains disabled:

```ts
const auth = await getAdminAuth()
await auth.api.createUser({
  body: { email, password, name: "관리자", role: "admin" },
})
```

Never expose that runner as an HTTP route or Server Action. Delete it immediately
after execution, never print the password, and never persist credentials in
source, tracked files, or shell history. If they ask again later,
read the configured admin path and repeat the same URL instead of inventing a
new path. After login, point them to `adminRoutes.account` when they want to
change the password.

### 12. Remove this skill

```bash
node .agents/scripts/cleanup-skill.mjs auth-setup
```

If cleanup fails, report the remaining entrypoint.

## Auth guard — in layouts, not the request proxy

After auth is wired up, **do not** add authentication logic to `src/proxy.ts`.
The proxy is a routing boundary; session verification, expiry, and revoked
session handling stay in a Server Component layout:

- Group protected routes under a route group, e.g. `src/app/({service})/(protected)/...` or `src/app/({service})/{service}/(protected)/...`.
- Keep the login page OUTSIDE that group. Admin account/password pages stay
  inside the protected group; there is no admin signup page.
- Create `{...}/(protected)/layout.tsx`:

  ```tsx
  import { redirect } from 'next/navigation'
  import { get{Service}ServerSession } from '@/server/auth/{service}'

  export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await get{Service}ServerSession()
    if (!session?.user) redirect('/login')
    return <>{children}</>
  }
  ```

Trade-off: you lose a `next=<original-path>` query on the redirect (RSCs cannot
read the current pathname without help from the request proxy). Accept this for
MVP; users navigate back manually after login.

## Pitfalls recap

- **Placeholder substitution**: do it yourself. `sed \U` does not work on macOS BSD sed.
- **`import 'server-only'` in Drizzle schema**: breaks `pnpm drizzle-kit generate/migrate`. Never add it under `src/server/db/plugin/**`.
- **Drizzle adapter schema**: must explicitly map `user`/`session`/`account`/`verification`. Shortcut `schema: schema` fails at runtime.
- **Runtime lifetime**: keep Better Auth request-cached. The database client
  may be reused because its URL/token are app-runtime configuration, not a
  request-scoped binding.
- **Session cookie cache**: enable the one-hour compact cache only for
  non-admin services and keep `nextCookies()` last. Admin stays uncached at the
  cookie layer.
- **Auth rendering**: await basic `getMe()` below the service-root
  `<Suspense fallback={null}>`, then hydrate the user query before rendering
  consumers. Only separate-table data loads lazily. Protected layouts retain
  their server-side session guard.
- **Package manager**: use `pnpm drizzle-kit …`, not `npx drizzle-kit …`.
- **Auth guard**: always in a Server Component layout, never in the request proxy.
- **OAuth callback origin**: use the reference's dynamic `baseURL` with
  `allowedHosts: ["*"]`. It detects the hosted domain automatically, so adding
  a custom domain does not require a URL environment variable. Use
  `protocol: config.NODE_ENV === "development" ? "auto" : "https"`; it keeps
  local HTTP development working and avoids an unregistered `http://` callback
  behind a TLS-terminating proxy in hosted environments.

## Member table ID sync (if applicable)

Projects that add a `{service}_member_profile` table should key it by the auth user id:

- When a user is created (public app sign-up or server-only provisioning), create
  the profile row with `id = session.user.id`.
- Fetch that profile through a separate API/query after basic user hydration.
  `getMe` returns only the Better Auth user and never depends on profile rows.
