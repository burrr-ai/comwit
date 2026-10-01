# create-comwit

**The Comwit Next.js template as one command.** Screens sliced by service and
domain, four layers that depend one way, an `.ai.md` rulebook next to every
layer, and agent skills for the app shell, auth and SEO. The State and UI
libraries come pre-wired.

```bash
npm create comwit@latest my-app
# or
npx create-comwit@latest my-app
# Cloudflare Workers through OpenNext
npm create comwit@latest my-app -- --opennext
```

```
page → state → api → repository
```

## What you get

```
src/
  app/                      Next.js App Router — routing only
  services/
    .ai.md · api.ai.md · state.ai.md · page.ai.md · design.md
    app/                    end-user service
      api/{domain}/         server actions shaped for the screen
      state/{domain}/       @comwit/state model · actions · hook
      page/{route}/         sections that read state and call actions
    admin/                  separate operator service (own auth, own UI)
  lib/                      shared code; comwit-ui components installed as source
  server/repository/        the only gateway to data
.agents/skills/             app-setup · auth-setup · seo-optimize
eslint-rules/               Oxlint rules that enforce the layer boundaries
AGENTS.md                   the rules file every coding agent reads
```

- **Next.js 16** App Router with Cache Components, a service worker and offline page.
- **@comwit/state** domain hooks, **comwit-ui** components you own, Tailwind v4 tokens.
- **Better Auth + Drizzle** wired by the `auth-setup` skill once a database is connected.
- **No infrastructure lock-in.** The template does not assume a database, a bucket
  or a hosting platform; `AGENTS.md` explains how to add each. `--opennext` opts
  into Cloudflare Workers (`@opennextjs/cloudflare` + wrangler) up front.

## Options

| Flag                          | Effect                                                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| `--name <name>`               | package name (default: the directory name)                                                                |
| `--pm <pnpm\|npm\|yarn\|bun>` | package manager (default: pnpm when installed)                                                            |
| `--no-install`                | skip dependency installation                                                                              |
| `--no-git`                    | skip `git init` and the initial commit                                                                    |
| `--cwd <dir>`                 | create the project relative to this directory                                                             |
| `--dry`                       | list the files that would be written                                                                      |
| `--opennext`                  | Cloudflare Workers via OpenNext: adds `wrangler.jsonc`, `open-next.config.ts`, `preview`/`deploy` scripts |

## Docs

Why the folders look this way, the layer rules and the agent workflow:
https://library.comwit.io/template
