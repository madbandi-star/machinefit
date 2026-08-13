# Test handoff — Scrub gym_members.email

## Summary
Cleared all non-empty `gym_members.email` values to NULL (16 rows on connected DB). Column kept intentionally. Migration `131_scrub_gym_members_email.sql` records the same scrub for other envs.

## Git
- Branch: `main`
- Commit: `1be4219f`

## Changed files
- `database/migrations/131_scrub_gym_members_email.sql`

## Test focus
- After apply: `SELECT COUNT(*) FROM gym_members WHERE email IS NOT NULL AND BTRIM(email) <> ''` → 0
- Member create/edit still works (email optional / unused)

## Fast checks
```powershell
Test-Path database/migrations/131_scrub_gym_members_email.sql
rg -n "SET email = NULL" database/migrations/131_scrub_gym_members_email.sql
```

## Production
- Connected DB already scrubbed (16 → 0).
- Apply migration 131 on Render/other DBs if they still have values.

## As-is → To-be
- **As-is:** 16 gym_members emails stored
- **To-be:** all NULL; field remains
