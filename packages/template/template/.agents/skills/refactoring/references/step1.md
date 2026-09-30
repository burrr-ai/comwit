# Step 1: Structure Refactoring Based on .ai.md

## Project Path

{PROJECT_PATH}

## Your Task

### 0. Read Architecture Rules (DO FIRST)

Read these files to understand the architecture:

- `src/services/.ai.md`
- `src/services/api.ai.md`
- `src/services/state.ai.md`
- `src/services/page.ai.md`
- `src/server/repository/.ai.md`

Data flow: `page → state → api → repository`

**Service structure:** Default is app (user) and admin (administrator). If there is a completely different user type with its own screens, separate it into its own service.

### 1. Identify Domains

List all domains in the project (e.g., user, product, order)

### 2. Find Violations

Check the whole `src/` tree against the three checklists below and write down
every violation before fixing anything. On a large project you may split the
three checklists across parallel subagents and merge their lists; otherwise do
it inline.

**API Violations**

- Missing `src/services/{service}/api/{domain}/` structure (must have types.ts, index.ts)
- Route handlers in `src/app/api/**` (must convert to server actions)
- Exception: `src/app/api/auth/**` is allowed

**State Violations**

- Missing `src/services/{service}/state/{domain}/` structure (must have types.ts, model.ts, actions/, index.ts)
- Auth checks in UI components (must use `@Authorized` decorator in actions)
- Auth state outside `state/user/` (must be centralized)

**Page Violations**

- Missing `src/services/{service}/page/{route}/` structure
- Hardcoded data in components (must move to `src/server/repository/_data/`)
- Direct api imports in pages (must go through state layer)
- Client-side data processing: code that manipulates data via `.filter()`, `.slice()`, `.reduce()`, `.length`, etc. → must be joined/aggregated on the API side and returned

### 3. Fix Violations

Fix every violation on the list according to the .ai.md rules.

**Rules:**

- Mock first: mock data in `src/server/repository/_data/`
- Keep existing real API integrations unchanged
- Image upload uses the project storage presign integration (if needed, connect
  a bucket following AGENTS.md § Storage)
- Server actions can receive files directly: `file: File | File[]`

### 4. Validate

```bash
pnpm run validate
```

Fix any errors before proceeding.

### 5. Re-check Once

Run the step 2 scan one more time. Fixes often introduce new violations: a
moved page that still imports api directly, an inline array that was copied
instead of moved, a domain folder missing its index.ts. Fix anything found and
validate again. Then stop; do not scan a third time.

### 6. Report (REQUIRED)

You MUST report:

1. Files fixed
2. Remaining violations you could not fix, and why

Example:

```
Fixed: src/services/app/api/user/types.ts, src/services/app/api/user/index.ts, ...
Remaining: none
```
