# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Comwit is a React state management library designed for LLM-friendly vibe coding. It uses proxy-based reactivity (similar to valtio) with a built-in query/resource system (similar to TanStack Query) and class-based action interceptors (decorators).

## Commands

```bash
# Install (yarn only — enforced by preinstall hook)
yarn install

# Build the library
yarn build                          # all workspaces
yarn workspace comwit build         # library only

# Dev
yarn dev:lib                        # watch-build library
yarn dev:docs                       # docs site (Next.js)
yarn dev:playground                 # playground app (port 3001)

# Test (vitest, in packages/comwit)
yarn test                           # run all tests once
yarn workspace comwit test:watch    # watch mode
yarn workspace comwit run vitest run tests/model.test.ts  # single file

# Type checking
yarn workspace comwit typecheck

# Format
yarn format                         # prettier --write on everything
yarn format:check                   # CI check
```

## Architecture

### Core (`packages/comwit/src/core/`)

- **proxy.ts** — Custom proxy-based reactivity engine. `createProxy()` wraps objects in recursive Proxies that track mutations and batch notifications via microtask. `snapshot()` deep-clones + freezes for immutable reads. `subscribe()` registers listeners on a proxy's internal state.

- **model.ts** — `model(initial)` creates a Model descriptor. Each Model holds a `key` (Symbol), a `ResourceDescriptorMap` (for query fields), and an `instance()` factory that creates a proxy store entry. `useModel(model, selector?)` is the React hook — uses `useSyncExternalStore` with structural equality (`isEqual` from es-toolkit) to prevent unnecessary re-renders.

- **query.ts** — The resource/query system. `query({ initialData, queryFn })` creates a resource descriptor that is embedded in model state. At runtime, `bindResourceState()` wraps resource fields with Proxy accessors that add `.query()`, `.refetch()`, `.set()` methods (and `.nextFetch()`/`.previousFetch()` for infinite queries). Includes caching with `staleTime`, `gcTime`, and `placeholderData` support.

- **action.ts** — `action(factory)` defines action modules. The factory receives `{ state, context }` where `state(model)` returns the proxy with bound resources. Actions support class instances — prototype methods are walked and bound. Lazy interceptor factories (decorators) stored on methods are resolved at bind time via `resolveLazyInterceptors`.

- **provider.tsx** — `<ComwitProvider>` creates a React context holding a `StoreRegistry` (Map of Model → StoreEntry), shared `queryDefaults`, `queryBinding` registry, and user-provided `context` object.

- **silent.ts** — `silent(() => { ... })` suppresses re-render notifications during mutations (for SSR/hydration).

### Interceptors (`packages/comwit/src/interceptors/`)

Built on `intercept(hooks | factory)` which creates method/class decorators with lifecycle hooks (`onBefore`, `onSuccess`, `onError`, `onSettled`, `intercept`). Two modes:

- **Immediate**: `intercept({ onError: ... })` — hooks applied at decoration time
- **Lazy**: `intercept((ctx) => ({ ... }))` — factory stored, resolved when action binds to context

Pre-built decorators: `onError`, `onSuccess`, `debounce`, `throttle`, `transaction`, `onAuthorized`, `retry`, `queue`, `log`.

### Utils (`packages/comwit/src/utils/`)

Re-exports from `es-toolkit`: `isEqual`, `debounce`, `throttle`, `pipe` (flow), `compose` (flowRight).

## Key Patterns

- **Yarn only** — enforced via `preinstall` script. Never use npm/pnpm.
- **Vitest config is in `vite.config.ts`** — no separate `vitest.config.ts`. Test environment uses `happy-dom`.
- **Tests live in `packages/comwit/tests/`** — `.test.ts` for unit tests, `.test.tsx` for React integration tests (using `@testing-library/react`).
- **ESM-first** — `"type": "module"` in package.json. Builds to both ESM and CJS via Vite library mode.
- **Husky + lint-staged** — pre-commit runs prettier on staged files.
- **`es-toolkit` is the sole runtime dependency** — used for equality checks and function utilities. Avoid adding new runtime deps.
