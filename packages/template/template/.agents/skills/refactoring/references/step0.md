# Step 0: Prerequisites Setup

## Project Path
{PROJECT_PATH}

## Your Task

**This step ensures DB and Auth are set up before refactoring begins.**

### 1. Check Database Setup

```bash
test -f src/server/db/index.ts && test -f drizzle.config.ts && echo "DB_EXISTS" || echo "NO_DB"
```

**If `NO_DB`:**
- Connect a database following AGENTS.md § Database (Drizzle client in
  `src/server/db/index.ts`, `drizzle.config.ts` at the root, `DATABASE_URL` in
  `.env`), then write the confirmed schema and run `pnpm drizzle-kit generate` /
  `pnpm drizzle-kit migrate` with the user's approval
- Wait for completion before proceeding

### 2. Check Auth Setup

```bash
test -d src/server/auth && echo "AUTH_EXISTS" || echo "NO_AUTH"
```

**If `NO_AUTH`:**
- Invoke `auth-setup` skill using the Skill tool
- Wait for completion before proceeding

### 3. Validate Setup

After both setups complete:

```bash
pnpm run validate
```

Fix any errors before proceeding.

### 4. Report

Report:
- DB setup status (already existed / newly created)
- Auth setup status (already existed / newly created)
- Any issues encountered

## Important

- Do NOT skip this step
- Do not ask whether to run the prerequisites; run them automatically. Still
  honor the explicit user checkpoint before creating a new database or
  applying a migration.
- Both the database connection and auth-setup MUST be complete before Step 1
