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

## 3. Sentry (optional, free Developer plan)

| Side | Env | Package |
|------|-----|---------|
| Backend | `SENTRY_DSN` (+ optional `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE`) | `@sentry/node` (`ops/sentry.ts`) |
| Frontend | `VITE_SENTRY_DSN` (+ optional `VITE_SENTRY_ENVIRONMENT`, `VITE_SENTRY_TRACES_SAMPLE_RATE`) | `@sentry/react` (`app/sentry.ts`) |
| Source maps (CI) | `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | `@sentry/vite-plugin` (soft-fail) |

When DSN is unset, init is a no-op. PII scrubbing strips Authorization/Cookie/tokens; user context is **id only**. Default traces sample rate **5%** in production. Health/ready/live/warmup are not traced. Dev browser events are off unless `VITE_SENTRY_ENABLE_DEV=true`.

### Enable (free)

1. Create two Sentry projects: `machinefit-frontend`, `machinefit-backend` (Developer plan).
2. Render → Environment: `SENTRY_DSN=<backend DSN>`, `SENTRY_ENVIRONMENT=production`, `SENTRY_TRACES_SAMPLE_RATE=0.05`
3. GitHub → Secrets: `VITE_SENTRY_DSN=<frontend DSN>`; optional source maps: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
4. Redeploy backend (Render) + push frontend (Pages workflow embeds `VITE_SENTRY_DSN`)

Errors also flow through existing Ops ingest / `dr-alerts`.

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
