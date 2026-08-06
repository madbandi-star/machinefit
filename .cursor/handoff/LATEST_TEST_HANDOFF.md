# Test handoff: Serve app at https://machine-fit.com/

## Summary
Vite/PWA/router base moved from `/machinefit/` to `/`. Catalog asset URLs and seeds use `/assets/...`. Migration `105` rewrites live DB image paths. Canonical app URL is domain root.

## Git
- Branch: `main`
- Commit: pending

## Changed (key)
- `frontend/vite.config.ts`, `frontend/src/routes/index.tsx`
- `shared/src/constants/site.ts`
- `database/scripts/build-catalog.mjs`, `catalog.generated.ts`, seeds
- `database/migrations/105_rewrite_catalog_asset_base_path.sql`
- `docs/DEPLOY.md`, `render.yaml`, Polar defaults

## Test focus
1. After Pages deploy: `https://machine-fit.com/` loads (not `/machinefit/`)
2. Assets: `/assets/brands/...` 200
3. Deep link + PWA start URL
4. After `105` migrate: machine images not 404

## Ops required (user)
1. Render: `FRONTEND_BASE_URL=https://machine-fit.com`
2. `npm run db:migrate` (105) on production DB
3. Kakao/Google redirect URIs for `https://machine-fit.com/` and `/settings/linked-logins`
4. Cloudflare: cache `/assets/*`; optional redirect `/machinefit*` → strip prefix

## Fast checks
```bash
rg -n "base: '/'|SITE_APP_BASE_PATH|ASSET_BASE" frontend/vite.config.ts shared/src/constants/site.ts database/scripts/build-catalog.mjs
rg -n "/machinefit/assets" backend/server/data/catalog.generated.ts || true
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| `https://machine-fit.com/machinefit/` | `https://machine-fit.com/` |
