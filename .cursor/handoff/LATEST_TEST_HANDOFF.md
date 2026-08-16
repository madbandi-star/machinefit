# Test handoff — Brand defaults + card stars

## Summary
Brand list cards show ★. Admin brands show favorite counts and can mark `is_default_favorite`. New users are seeded once from those defaults on first brand-favorites fetch (search uses that list).

## Git
- Branch: `main`
- Commit: 061e5d60

## Ops required
1. Apply `141_user_favorite_brands.sql` (if not yet) and `142_brand_favorite_defaults.sql`.
2. Redeploy Render backend.

## Test focus
1. `/brands` — ★ toggles without opening detail.
2. Admin brands — meta shows 즐겨찾기 N명; 기본 즐겨찾기 toggle/checkbox.
3. Brand-new account: search brand chips = admin defaults after first favorites load.
4. Existing users: not backfilled; clearing all does not re-apply defaults.

## Fast checks
```bash
rg -n "is_default_favorite|seedDefaultsIfNeeded|brand-card__favorite" frontend/src backend/server database/migrations
npm run build -w @machinefit/shared
npx tsc --noEmit -p frontend/tsconfig.json
```

## as-is → to-be
- **as-is:** No card stars / admin preset / counts.
- **to-be:** Card ★ + admin counts + new-user default brand seed.
