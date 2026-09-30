---
name: refactoring
description: Run the project refactoring workflow. Explicit invocation only — the user must invoke it themselves (`/refactoring` in Claude Code and Antigravity, `$refactoring` in Codex). Never select this skill on your own for ordinary refactoring, abstraction, cleanup, restructuring, or database requests.
disable-model-invocation: true
---

# Refactoring: Maintenance Mode

Run only after the user explicitly invokes `$refactoring` in Codex or
`/refactoring` in Claude or Antigravity.

Never infer this workflow from ordinary requests for refactoring, cleanup,
restructuring, abstraction, or database work.

## How to run

Work through the steps below in order. Before each step read its reference
file from `.agents/skills/refactoring/references/` completely, replace
`{PROJECT_PATH}` with the workspace root, then do what it says. Every step
ends with `pnpm run validate`; fix every error before moving on.

Delegation is optional. On a large project you may hand one step to a single
subagent with the resolved step text as its prompt; wait for it to finish and
check the repository state before the next step. Do not run steps in parallel
and do not repeat a step in a loop.

## Flow

### Pre-step: remove dead code

Run before Step 1:

```bash
bash .agents/skills/refactoring/knip-clean.sh
```

### Step 1: structure refactoring

Run `references/step1.md`. It finds every `.ai.md` violation, fixes them all,
validates, then re-checks once for violations the fixes introduced. When it
reports clean, commit the files it changed.

### Steps 2 through 4

Run each remaining reference once:

- `references/step2.md`: schema changes, only if Step 1 needs them
- `references/step3.md`: repository/API implementation
- `references/step4.md`: README update

### Finish

```bash
bash .agents/skills/refactoring/knip-clean.sh
pnpm run validate
```

```bash
touch .refactoring-done
git add .
git commit -m "refactoring"
git push origin main
```

Preserve unrelated changes and stop on validation failures.
