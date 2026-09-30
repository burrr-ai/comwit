---
name: refactoring
description: Run the project refactoring workflow. Explicit invocation only — the user must invoke it themselves (`/refactoring` in Claude Code and Antigravity, `$refactoring` in Codex). Never select this skill on your own for ordinary refactoring, abstraction, cleanup, restructuring, or database requests.
disable-model-invocation: true
---

# Refactoring

Run this workflow only after the user explicitly invokes the runtime's
refactoring entry point:

- Codex: `$refactoring`
- Claude: `/refactoring`
- Antigravity: `/refactoring`

Never infer this workflow from ordinary requests for refactoring, cleanup,
restructuring, abstraction, or database work.

## Canonical resources

Resolve all workflow files from `.agents/skills/refactoring/`:

- `references/step0.md` through `references/step5.md`
- `references/self-update.md`
- `knip-clean.sh`
- `assets/SKILL-maintenance.md`

## How to run

Work through the steps below in order. Before each step read its reference
file completely, replace `{PROJECT_PATH}` with the workspace root and
`{SELECTED_DOMAINS}` with the checkpoint result where the step uses it, then
do what it says. Every step ends with `pnpm run validate`; fix every error
before moving on.

Delegation is optional. On a large project you may hand one step to a single
subagent with the resolved step text as its prompt; wait for it to finish and
check the repository state before the next step. Do not run steps in parallel
and do not repeat a step in a loop. Each reference says how to confirm it is
done.

## Select mode

Check for mock repositories:

```bash
ls src/server/repository/_data 2>/dev/null && echo "MOCK_EXISTS" || echo "NO_MOCK"
```

- `MOCK_EXISTS`: run the full flow.
- `NO_MOCK`: run maintenance mode.

## Full flow

### Pre-step: remove dead code

Run before Step 0:

```bash
bash .agents/skills/refactoring/knip-clean.sh
```

### Step 0: prerequisites

Run `references/step0.md`. It connects the database (AGENTS.md § Database)
and invokes `auth-setup` when their prerequisites are missing.

### Step 1: structure refactoring

Run `references/step1.md`. It finds every `.ai.md` violation, fixes them all,
validates, then re-checks once for violations the fixes introduced. When it
reports clean, commit the files it changed.

### Step 2: normalize mock data

Run `references/step2.md`.

### Checkpoint: choose real-database domains

After Step 2, list `src/server/repository/_data` and ask the user in plain
language whether to connect all, some, or none of the remaining mock domains.
Translate domain names to Korean where helpful, for example `user` → 회원,
`product` → 상품, `order` → 주문, `post` → 게시글, `comment` → 댓글,
`like` → 좋아요, `cart` → 장바구니, and `payment` → 결제.

- All: pass every domain to Steps 3 and 4.
- Partial selection: pass only the selected domains.
- Later/no: skip Steps 3 and 4.

Do not use a structured question tool for this checkpoint.

### Step 3: schema

Run `references/step3.md` with only the selected domains.

### Step 4: real repository implementation

Run `references/step4.md` with only the selected domains. Delete only the
selected domains' mock files.

### Step 5: README

Run `references/step5.md`.

### Finish

Run:

```bash
bash .agents/skills/refactoring/knip-clean.sh
pnpm run validate
```

Commit the changes from Steps 2 through 5. If no mock files remain, run
`references/self-update.md`. Otherwise leave the skill in full mode for the
next explicit invocation.

## Maintenance mode

When `src/server/repository/_data` does not exist:

1. Run `knip-clean.sh`.
2. Run Step 1 and commit.
3. Run Step 3 if schema changes are needed.
4. Run Step 4 for repository/API changes.
5. Run Step 5.
6. Run `knip-clean.sh` and `pnpm run validate`, then commit.

## Safety

- Preserve unrelated pre-existing changes; commit only the files this workflow
  touched.
- Do not skip the real-database confirmation checkpoint.
- Do not broaden the selected mock-data domains.
- Stop on validation failures and fix them before continuing.
- Do not push unless `references/self-update.md` explicitly reaches its push
  step.
