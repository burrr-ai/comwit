---
description: Run the project refactoring workflow only when the user explicitly invokes `/refactoring`.
---

# Refactoring

This is a manually invoked Antigravity workflow. Never infer or run it from an
ordinary request for refactoring, abstraction, cleanup, restructuring, or
database work.

## Canonical workflow

1. Resolve the current workspace root.
2. Read `.agents/skills/refactoring/SKILL.md` completely.
3. Treat `.agents/skills/refactoring/` as the canonical resource directory for
   this workflow.
4. Follow the mode selection, step order, user checkpoint, validation,
   commits, and self-update rules in that file exactly.
5. Before each step, read the referenced
   `.agents/skills/refactoring/references/*.md` file completely and replace
   `{PROJECT_PATH}` and `{SELECTED_DOMAINS}` as instructed.

## Antigravity runtime notes

Work through the steps in this conversation. If the canonical workflow's
optional delegation is useful for a large step, use Antigravity's
`invoke_subagent` with a new `self` subagent in the same workspace, give it the
resolved step text, wait for it to become idle, and check the repository state
before the next step.

Use `.agents/skills/refactoring/knip-clean.sh` whenever the canonical workflow
requests dead-code cleanup.

## Safety

- Preserve unrelated pre-existing changes.
- Do not skip the real-database confirmation checkpoint.
- Do not broaden the selected mock-data domains.
- Stop on validation failures and fix them before continuing.
- Do not push unless the canonical workflow explicitly reaches a push step.
