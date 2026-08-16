# Test handoff — Duplicate request guards

## Summary
Global `useAsyncAction` / `asyncActionGuard` (ref lock + 3s failure cooldown), axios 429 Retry-After, optional in-memory `Idempotency-Key` on push send + checkout/trial, push send rate limit.

## Git
- Branch: `main`
- Commit: a6613294

## Ops
- Redeploy Render backend (no new migration).

## Test focus
1. Checkout / trial / premium modal: mash → 1 call; fail → disabled ~3s with retry label.
2. Push send: mash Enter → 1 campaign; same Idempotency-Key replays.
3. Brand favorite ★ mash → 1 write.
4. 429 → `errors.rateLimit` toast path via catalog.

## Fast checks
```bash
npx vite-node frontend/src/utils/asyncActionGuard.test.ts
npx tsc --noEmit -p frontend/tsconfig.json
rg -n "useAsyncAction|idempotencyMiddleware|pushSendRateLimit" frontend/src backend/server
```

## as-is → to-be
- **as-is:** Soft isPending only; generic failure copy; push/checkout mash risk.
- **to-be:** Shared guard + idempotency on critical writes; clearer rate/network errors.
