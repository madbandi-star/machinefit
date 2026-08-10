# Test handoff — Sentry production smoke verified

## Summary
Production smoke events were fired for both projects. Temporary backend `/ops/sentry-smoke` was used once (HTTP 500) and then removed.

## Results
- **Frontend**: Sentry store accepted event id `bd7af71fa9d27b06679a34ab0ea6461a` (`MachineFit frontend Sentry smoke test`)
- **Backend**: `GET /api/v1/ops/sentry-smoke?...` returned **500** on deploy `8904064` (requestId `265f9430-4ecf-41a8-8bc3-2cc5312e0cef`)

## Test focus
1. Open Sentry **machinefit-frontend** → Issues → smoke message present
2. Open Sentry **machinefit-backend** → Issues → `MachineFit backend Sentry smoke test`
3. After cleanup deploy, smoke URL should be **404**

## as-is → to-be
- as-is: DSN configured, live capture unproven
- to-be: both smokes sent; smoke route removed from code
