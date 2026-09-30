# Self-Update: Convert to Maintenance Mode

## Project Path
{PROJECT_PATH}

## Pre-Check (CRITICAL)

**First, verify ALL mocks are gone:**

```bash
ls src/server/repository/_data 2>/dev/null
```

**If _data folder exists or has contents:**
- **STOP immediately**
- Report: "Mocks still remain. Skipping self-update."
- Do NOT proceed with any steps below

**Only continue if _data folder is completely empty or doesn't exist.**

---

## Your Task

**This step updates the refactoring skill itself for future use.**

After ALL mock data is connected to real DB, the skill converts to maintenance mode.

### 1. Delete Mock-Related Step Files

```bash
rm -f .agents/skills/refactoring/references/step0.md
rm -f .agents/skills/refactoring/references/step2.md
```

### 2. Rename Remaining Steps

```bash
mv .agents/skills/refactoring/references/step3.md .agents/skills/refactoring/references/step2.md
mv .agents/skills/refactoring/references/step4.md .agents/skills/refactoring/references/step3.md
mv .agents/skills/refactoring/references/step5.md .agents/skills/refactoring/references/step4.md
```

### 3. Update Step Content for Maintenance Mode

**Edit step2.md (was step3.md - Schema):**
- Remove mock data analysis section
- Focus on schema addition/modification only

Replace content with:
```markdown
# Step 2: Schema Changes

## Project Path
{PROJECT_PATH}

## Your Task

### 1. Check Schema Requirements

Review code changes from Step 1:
- New entities that need tables?
- Existing tables that need new fields?
- Relationships to add/modify?

### 2. Update Schema

If schema changes needed:
- Edit `src/server/db/schema/` files
- Create DBML first, then convert to Drizzle

### 3. Apply Migrations

```bash
pnpm drizzle-kit generate
```

Read and summarize the generated SQL, then obtain explicit confirmation before
`pnpm drizzle-kit migrate` applies it remotely.

**If migration fails:** Stop and report error.

### 4. Validate

```bash
pnpm run validate
```

Report schema changes and any issues.
```

**Edit step3.md (was step4.md - Real API):**
- Remove mock folder deletion (already gone)
- Focus on repository/API implementation updates

Replace content with:
```markdown
# Step 3: API Implementation

## Project Path
{PROJECT_PATH}

## Your Task

### 1. Implement/Update Repository & APIs

For each repository in `src/server/repository/{domain}.ts`:
- Implement real DB queries as needed
- Update existing repository for new schema

For each API in `src/services/{service}/api/{domain}/`:
- Update server actions if needed
- API layer calls repository — follow patterns in `.ai.md` files

### 2. Auth Integration

- Use auth session for user ID
- Verify `services/{service}/state/user` integration

### 3. Validate

```bash
pnpm run validate
```

Report APIs implemented and any issues.
```

**Edit step4.md (was step5.md - README):**
- No changes needed, just renumbered

### 4. Replace SKILL.md with Maintenance Mode Version

```bash
cp .agents/skills/refactoring/assets/SKILL-maintenance.md .agents/skills/refactoring/SKILL.md
```

### 5. Update .ai.md files

Remove mock-related content from `src/services/api.ai.md` and `src/server/repository/.ai.md`:

**Remove these sections:**
- "Mock First" rule
- "Mock Data Rules" section

**The updated .ai.md files should NOT contain:**
- References to `src/server/repository/_data/`
- "Mock First" or mock data instructions

### 6. Delete self-update.md and assets folder

```bash
rm -f .agents/skills/refactoring/references/self-update.md
rm -rf .agents/skills/refactoring/assets
```

### 7. Generate Config, Create Marker & Commit

Edit skill files in `.agents/skills/refactoring/`; `.claude/skills/refactoring/SKILL.md`
is a stub that points there, so update its description if the canonical one changed.
Service guides live in `src/services/{page,state}.ai.md`.

```bash
touch .refactoring-done
git add .
git commit -m "refactoring: convert to maintenance mode"
git push origin main
```

### 8. Report

Report:
- Files deleted (step0.md, step2.md, self-update.md, assets/)
- Files renamed (step3→2, step4→3, step5→4)
- SKILL.md replaced with maintenance mode version
- Generated config is current and skill links resolve
- .ai.md mock rules removed
- Committed and pushed

## Important

- This is a ONE-TIME operation
- **Only runs when ALL mocks are connected to real DB**
- After this, refactoring skill runs in maintenance mode
- No more mock-related steps will exist
