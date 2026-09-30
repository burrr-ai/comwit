# Next.js Development Assistant

You help build a Next.js project in this repository through chat. The folder
structure is the documentation: read the nearest `.ai.md` before working in a
folder, and run `pnpm run validate` after every change. `CLAUDE.md` imports
this file; Codex and Antigravity read it directly.

---

## Development Flow

1. **Screens first** with mock data; connect a DB only when the product needs real persistence.
2. **Dependency flow:** `page → state → api → repository`. Write bottom-up
   (`repository → api → state → page`) and read each layer's `.ai.md` first.

- No database is connected by default. All data lives in `src/server/repository/_data/`
  mock files; never hardcode data in pages.
- When a feature cannot work without persistence, ask "관리자 패널도 같이
  만들어야 해요. DB 연동까지 진행하고 모든 기능을 만들까요?" and tell the user
  to run `/refactoring` (Codex: `$refactoring`). Connecting the database itself
  follows the Database section below.
- App-like products (bottom tabs, fullscreen detail screens): run the
  `app-setup` skill before the first screen. SEO requests: the `seo-optimize`
  skill. Authentication: the `auth-setup` skill, after a database is connected.
  Skills live only in `.agents/skills/<name>/`; Claude Code reads the stub in
  `.claude/skills/<name>/` that points there. Change both together
  (`node .agents/scripts/cleanup-skill.mjs <name>` removes a one-time skill);
  `pnpm agents:test` checks they match.
- The refactoring workflow runs only when the user invokes it explicitly. Never
  infer it from an ordinary request for refactoring, cleanup, restructuring,
  abstraction or database work.

---

## Tech Stack & Rules

| Item | Rule |
|------|------|
| Package Manager | pnpm (not npm) |
| Framework | Next.js 16 App Router in `src/app/` (routing only). `next build` produces standard Next.js output |
| State | `@comwit/state` domain hooks in `src/services/{service}/state/{domain}` (`src/services/state.ai.md`) |
| UI | comwit-ui in `src/lib/components/ui`. Missing component → `pnpm ui add <name>`. Theme via `src/app/globals.css` tokens; Korean UI text in `src/lib/ui-text.ts` |
| File Naming | kebab-case (`hero-section.tsx`) |
| Image | `<img />`, not `<Image />` |
| Loading | Auth user is hydrated once at the service root (`src/services/page.ai.md`); other data loads lazily via query + `isLoading` |
| Env | Server config goes through `src/server/config.ts`; `.env` is gitignored. Never expose secrets to the client, args, output or logs. Exception: the Better Auth `{SERVICE}_AUTH_SECRET` that `auth-setup` writes into `config.ts` |

**Database**: not connected. Screens run on mock data (Database section below).

**Storage**: not connected. Static images go in `public/` (Storage section below).

**Media**: site-owned videos never ship in Git or the app package — upload them
to the connected bucket and keep only their URLs in `src/lib/assets.ts`. Fonts
and design images stay local unless the user asks.

### Checks

- After every code change run `pnpm run validate` and fix all errors.
- Mutation testing runs only when the user explicitly asks for it — never as
  part of tests, validate, build, CI or `/refactoring`.

---

## Project Structure

```
.agents/                - Skills, scripts, rules/workflows (the only copy)
.claude/skills/         - Claude Code stubs pointing at .agents/skills/
eslint-rules/           - Oxlint rules that enforce the layer boundaries
src/
  services/             - One folder per user type (default: app, admin)
    ㄴ .ai.md            - Import rules, layer dependencies
    ㄴ api.ai.md / state.ai.md / page.ai.md - Per-layer rules
    ㄴ design.md         - Design tone; read before any screen work
    {service}/
      api/{domain}/     - Server Actions
      state/{domain}/   - State (comwit)
      page/{route}/     - Page components
    admin/
      ㄴ .ai.md          - Admin routes, public prefix proxy, initial account
  app/                  - Next.js App Router (routing only)
    ㄴ .ai.md
  lib/                  - Shared components, hooks, utilities (installed comwit-ui source)
  server/               - Server-only (config, repository)
    repository/         - Single gateway for all data access & mock data
      ㄴ .ai.md
```

Read the nearest `.ai.md` before working in a folder. Split out a new service
only for a genuinely different user type with its own screens.

---

## Database

Connect one only when persistence is real. Drizzle ORM is the stack; the
database and driver are the project's choice (libSQL/Turso, SQLite, Postgres, …).

1. Install the driver and put the server-only client in `src/server/db/index.ts`.
   Keep `drizzle.config.ts` at the project root: it runs in plain Node, loads
   `.env` itself and never imports `server-only` or `src/server/config`
   (Oxlint `drizzle-node-config`).
2. `DATABASE_URL` (and any driver token) go in `.env`, never in tracked source.
3. Define tables in `src/server/db/schema.ts` with an index for every query.
   Run `pnpm drizzle-kit generate`, read and summarize the SQL, then run
   `pnpm drizzle-kit migrate` only after explicit user approval. Never edit
   generated migrations or the database by hand.
4. Replace `_data/` reads inside repositories and keep their signatures, so the
   api layer does not change (`/refactoring` does this per selected domain).
   Seed and query only through project-owned server-only scripts or
   repositories, never an ad-hoc CLI.

## Storage

Connect an S3-compatible bucket only when the product needs uploads. A
server-only module (`src/server/storage/`) issues presigned PUT/GET/DELETE URLs
from bucket settings kept in `.env`; the browser resizes first (`resizeImage`
in `src/lib/image`) and PUTs directly with exactly the returned headers; the
api layer returns the public URL and the app stores
`ImageAsset { url, width, height }` (`src/services/page.ai.md`). Never proxy
large bodies through a server action or expose credentials through
`NEXT_PUBLIC_*`, responses or logs.

---

## Deploy

`pnpm run validate` → `pnpm run build` → `pnpm start` on any Node 22 host, or
the hosting platform's Next.js adapter. Set `SITE_URL` there (absolute URLs
for og:image and sitemap). The deployment ID comes from `NEXT_DEPLOYMENT_ID`,
`DEPLOYMENT_VERSION` or the Git SHA; the service worker and `AppVersionGuard`
use it to refresh stale clients. Do not deploy on the user's behalf; after
validation, tell the user how to deploy with their platform.
