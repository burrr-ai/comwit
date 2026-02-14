# Transaction Todo

1. Implement scope-aware transaction context in `packages/mucha/src/core/provider.tsx` and `packages/mucha/src/core/index.ts` so action execution can run inside a transaction.
2. Track accessed models inside `packages/mucha/src/core/action.ts` (or action execution boundary) and expose scope to interceptors.
3. Update `packages/mucha/src/interceptors/transaction.ts` to:
   - capture per-model snapshots only for scoped models,
   - run action and catch errors,
   - rollback safely only when no external model version drift is detected.
4. Add model versioning helpers in `packages/mucha/src/core/proxy.ts` and export from `packages/mucha/src/utils/index.ts` for transaction checks.
5. Define a conflict path in `packages/mucha/src/interceptors/transaction.ts` (e.g., `TransactionConflict` error) to avoid blind overwrite when concurrent writes happened.
6. Add `undo`/`redo` notes and minimal API in `packages/mucha/src/interceptors/transaction.ts` (or a follow-up file) using change logs/inverse patches.
7. Clean docs in `packages/mucha/README.md` by keeping `Transaction` as an experimental/placeholder API only (no usage example).
8. Add examples for failure replay in `apps/playground/src/page/todo.tsx` and `apps/playground/src/state/todo/actions/*.ts` after transaction is implemented.
