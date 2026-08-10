# Test handoff — Backend Sentry smoke (temporary)

## Summary
Temporary `GET /api/v1/ops/sentry-smoke?key=mf-ops-sentry-smoke` throws so production Sentry backend Issues can be verified. Frontend smoke event was already accepted by Sentry ingest. Remove the route after confirmation.

## Git
- branch: `main`
- commit: (update after push)

## Test focus
1. Smoke URL returns HTTP 500 (not 404) after Render redeploy
2. Sentry **machinefit-backend** Issues: `MachineFit backend Sentry smoke test`
3. Sentry **machinefit-frontend** Issues: `MachineFit frontend Sentry smoke test` (already sent)

## Fast checks
```bash
rg -n "sentry-smoke" backend/server/routes/ops.routes.ts
```

## Production checks
```bash
curl -s -o /dev/null -w "%{http_code}" "https://machinefit.onrender.com/api/v1/ops/sentry-smoke?key=mf-ops-sentry-smoke"
```
Expect `500` after deploy. Wrong/missing key → `404`.

## as-is → to-be
- as-is: DSN secrets set; backend capture not proven
- to-be: both projects show smoke issues; then delete smoke route
