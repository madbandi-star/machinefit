# Test handoff: Black screen on machine-fit.com

## Summary
Custom domain HTML still uses `/machinefit/assets/*.js` while files are at `/assets/` → JS 404 → black screen. Root `base: '/'` is on `main`, but Pages **deploy** job kept timing out / getting cancelled. Workflow updated: no cancel-in-progress + retry deploy-pages.

## Git
- Branch: `main`
- Commit: (after push)

## Test focus
1. Actions: Deploy Frontend = **success** (not cancelled)
2. Live HTML: `src="/assets/….js"` (not `/machinefit/`)
3. That script URL returns real JS (200), app paints

## Fast checks
```bash
curl -sL https://machine-fit.com/ | rg -o 'src="[^"]+\.js"'
rg -n "base: '/'" frontend/vite.config.ts
```

## Interim (if Pages still stuck)
Cloudflare redirect: `/machinefit/*` → `https://machine-fit.com/$1` (still prefer successful root deploy)

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Black screen; `/machinefit/assets` 404 | App loads; `/assets/*.js` 200 |
