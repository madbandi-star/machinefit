# Test handoff: Fix ops Resolve/Ack actorId

## Summary
Ops **해결** / alert **확인** called `actorId` as `req.user.id`, but JWT auth sets `req.user.userId`. Admin id was always undefined → 401 → generic toast.

## Git
- Branch: `main`
- Commit: pending (updated after push)

## Changed files
- `backend/server/controllers/ops.controller.ts`
- `backend/server/middlewares/ops-metrics.middleware.ts`

## Test focus
1. Admin → Ops → Errors → click **해결** on an unresolved row.
2. Expect success toast (`ops.resolved`), row disappears from unresolved list.
3. Optional: Alerts **확인** if any open alerts.

## Fast checks
```bash
rg -n "user\?\.userId|actorId" backend/server/controllers/ops.controller.ts backend/server/middlewares/ops-metrics.middleware.ts
npm run test:smoke:changed
```

## Production checks
- **Requires Render backend redeploy** (API-only fix).
- Then retry 해결 on production admin ops.

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 해결 → "처리하지 못했어요. 잠시 후 다시 시도해 주세요." | 해결 → success; group marked resolved |
