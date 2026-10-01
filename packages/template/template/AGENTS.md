# Next.js Development Assistant

You help build a Next.js project in this repository through chat. The folder
structure is the documentation: read the nearest `.ai.md` before working in a
folder, and run `pnpm run validate` after every change. `CLAUDE.md` imports
this file; Codex and Antigravity read it directly.

---

## Development Flow

1. **Dependency flow:** `page → state → api → repository`. Write bottom-up
   (`repository → api → state → page`) and read each layer's `.ai.md` first.
2. **Data goes through `src/server/repository/`**, the single gateway. Never
   hardcode data in pages; the repository `.ai.md` has the rules.
3. **Services** slice by user type (default `app` and `admin`); **domains**
   slice by business object inside every layer. Split out a new service only
   for a genuinely different user type with its own screens.
4. **Skills.** App-like products (bottom tabs, fullscreen detail screens): run
   `app-setup` before the first screen. Authentication: `auth-setup`. SEO:
   `seo-optimize`. Skills live only in `.agents/skills/<name>/`; Claude Code
   reads the stub in `.claude/skills/<name>/` that points there. Change both
   together (`node .agents/scripts/cleanup-skill.mjs <name>` removes a one-time
   skill); `pnpm agents:test` checks they match.

---

## Tech Stack & Rules

| Item | Rule |
|------|------|
| Package Manager | pnpm (not npm) |
| Framework | Next.js 16 App Router in `src/app/` (routing only) |
| State | `@comwit/state` domain hooks in `src/services/{service}/state/{domain}` (`src/services/state.ai.md`) |
| UI | comwit-ui in `src/lib/components/ui`. Missing component → `pnpm ui add <name>`. Theme via `src/app/globals.css` tokens; Korean UI text in `src/lib/ui-text.ts` |
| File Naming | kebab-case (`hero-section.tsx`) |
| Image | `<img />`, not `<Image />` |
| Loading | Auth user is hydrated once at the service root (`src/services/page.ai.md`); other data loads lazily via query + `isLoading` |
| Env | Server config goes through `src/server/config.ts`; `.env` is gitignored. Never expose secrets to the client, args, output or logs. Exception: the Better Auth `{SERVICE}_AUTH_SECRET` that `auth-setup` writes into `config.ts` |

### Checks

- After every code change run `pnpm run validate` and fix all errors.
- Mutation testing runs only when the user explicitly asks for it — never as
  part of tests, validate, build or CI.

---

## Project Structure

```
.agents/                - Skills, scripts, rules (the only copy)
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
    repository/         - Single gateway for all data access
      ㄴ .ai.md
```

Read the nearest `.ai.md` before working in a folder.
