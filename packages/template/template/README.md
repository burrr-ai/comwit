# {{name}}

A Next.js 16 project scaffolded with [`create-comwit`](https://library.comwit.io/template).
Screens are split by service and domain, each layer carries its own `.ai.md`
rules, and lint rules keep the dependency direction one way:

```
page → state → api → repository
```

## Commands

```bash
pnpm install
pnpm run dev        # http://localhost:3000
pnpm run validate   # typecheck + lint (run after every change)
pnpm run build      # service worker + next build
pnpm start
pnpm ui add <name>  # install a comwit-ui component as source
```

## Where things go

| Path | Role |
| --- | --- |
| `src/app/` | App Router — routing only. Pages import from `src/services/{service}/page/`. |
| `src/services/{service}/api/{domain}/` | Server actions shaped for the screen that uses them. |
| `src/services/{service}/state/{domain}/` | `@comwit/state` model, actions and the domain hook. |
| `src/services/{service}/page/{route}/` | Page components split into sections. |
| `src/server/repository/` | The only gateway to data. Starts as mock rows in `_data/`. |
| `src/lib/` | Shared components (installed `comwit-ui` source), hooks and utilities. |
| `.agents/` | Skills (`app-setup`, `auth-setup`, `seo-optimize`, `refactoring`), scripts and rules for coding agents. |

Read `AGENTS.md` first, then the `.ai.md` next to each layer. Architecture
notes: https://library.comwit.io/template/docs/architecture

## Connecting a database or storage

The template runs on mock data until the product needs persistence. `AGENTS.md`
section 6 describes how to add a Drizzle database and an S3-compatible bucket;
`auth-setup` installs Better Auth once a database is connected.
