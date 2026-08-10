# Test handoff — Fix Render boot migration lock timeout (57014)

## Summary
Render `npm start` failed with `canceling statement due to statement timeout` (`57014`) during auto-migrate. Cause: session `pg_advisory_lock` orphaned under PgBouncer transaction pooling. Fix: skip lock when no pending migrations; use `pg_advisory_xact_lock` + `SET LOCAL statement_timeout = 0` when applying.

## Git
- branch: `main`
- commit: PENDING (filled after push)

## Changed files
- `backend/server/db/run-pending-migrations.ts`

## Test focus
1. Render backend process starts (no `Auto-migrate failed` / exit 1)
2. When DB has no pending files, log: `Auto-migrate complete: no pending files`

## Fast checks
```bash
rg -n "pg_advisory_xact_lock|statement_timeout|pending.length" backend/server/db/run-pending-migrations.ts
rg -n "pg_advisory_lock\(" backend/server/db/run-pending-migrations.ts || true
```

## Production checks
- After Render redeploy: service healthy; `start` does not crash
- Optional: hit API health endpoint

## as-is → to-be
- **as-is:** Boot waits on orphaned session advisory lock → 30s timeout → refuse start
- **to-be:** No lock if nothing pending; pending uses xact lock + long migrate timeout

## Note
Backend-only; Render redeploy required (GitHub Pages FE unchanged).
