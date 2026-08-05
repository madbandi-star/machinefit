# Ops hardening — CI, auth smoke, Sentry, demo-password purge

Date: 2026-08-05  
Branch: `cursor/ops-hardening-ci-sentry-demo-35b3`

## 1. CI quality gates

PR CI (`.github/workflows/ci.yml`) now runs:

1. `npm test` — shared + backend `*.test.ts` via `scripts/run-unit-tests.mjs`
2. `npm run db:verify:files` — migration filename / duplicate-number integrity (no DB)
3. `npm run db:verify` — **optional** when GitHub secret `DATABASE_URL` is set
4. Existing typecheck + builds

## 2. Auth smoke / load

```bash
# Public + optional auth chain
API_BASE=https://machinefit.onrender.com/api/v1 \
  SMOKE_EMAIL=you@example.com SMOKE_PASSWORD='…' \
  npm run test:smoke:auth

# Light authenticated load
CONCURRENCY=20 DURATION_SEC=15 SMOKE_EMAIL=… SMOKE_PASSWORD=… \
  npm run test:smoke:auth
```

Flow: `/health` → `/ready` → machines → login → `/users/me` → workout history → optional upsert.

## 3. Sentry

| Side | Env | Package |
|------|-----|---------|
| Backend | `SENTRY_DSN` | `@sentry/node` (init in `ops/sentry.ts`) |
| Frontend | `VITE_SENTRY_DSN` | `@sentry/react` (init in `app/sentry.ts`) |

When DSN is unset, init is a no-op. Errors also flow through existing Ops ingest / `dr-alerts`.

### Enable

1. Create Sentry projects (Node + React)
2. Render: `SENTRY_DSN=…`
3. GitHub Pages build secret / workflow: `VITE_SENTRY_DSN=…`

## 4. Demo password invalidation

Migration `096_invalidate_demo_password_hashes.sql`:

- Updates users still on the known `043` `demo1234` bcrypt hash
- Deletes their refresh tokens
- **Deploy:** `npm run db:migrate` after Render redeploy

Affected users must use password reset. Intentional demo seeds that shared that hash are also invalidated on prod.

## 5. Deploy checklist

1. Merge PR → FE Pages + BE Render hook  
2. `npm run db:migrate` (apply `096`)  
3. Optional: set `SENTRY_DSN` / `VITE_SENTRY_DSN`  
4. Optional: add repo secret `DATABASE_URL` for live `db:verify` in CI  
