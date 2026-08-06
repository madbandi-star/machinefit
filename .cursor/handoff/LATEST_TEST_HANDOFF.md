# Test handoff: Roll back root-domain cutover

## Summary
Reverted `machine-fit.com` root (`base: '/'`) cutover back to `/machinefit/` — state around Cloudflare env-recommendation ask (pre-`da3f5c6e`). Kept UTF-8 WorkoutLogPanel fix, ja/zh i18n keys, and Pages deploy retry workflow.

## Git
- Branch: `main`
- Commit: `ee1621a7`

## Test focus
1. `https://madbandi-star.github.io/machinefit/` loads
2. Vite `base: '/machinefit/'`, `SITE_APP_BASE_PATH = '/machinefit'`
3. Custom domain `machine-fit.com` may still look broken until Cloudflare is set per recommendation (path + Pages)

## Fast checks
```bash
rg -n "base: '/machinefit/'|SITE_APP_BASE_PATH = '/machinefit'" frontend/vite.config.ts shared/src/constants/site.ts
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Root-domain cutover attempts / black screen | App back on `/machinefit/` (GitHub Pages project URL) |
