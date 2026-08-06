# Test handoff: Black screen on machine-fit.com (asset base)

## Summary
Custom domain served old HTML with `/machinefit/assets/*.js` while files live at `/assets/` → JS 404 → black `#root`. Root `base: '/'` is on `main`; re-trigger Pages deploy so live `index.html` references `/assets/...`.

## Git
- Branch: `main`
- Commit: (pending push — check `git rev-parse HEAD`)

## Changed (this fix wave)
- `frontend/vite.config.ts` — `base: '/'` (already)
- `frontend/index.html` — SEO root URLs + deploy marker
- `WorkoutLogPanel.tsx` UTF-8 repair (unblocks CI build)
- i18n ja/zh keys for compact/rest/voice

## Test focus
1. `https://machine-fit.com/` HTML `script src` starts with `/assets/` (not `/machinefit/`)
2. That JS URL returns 200 (not HTML 404 page)
3. App paints (not black-only `#root`)

## Fast checks
```bash
curl -sL https://machine-fit.com/ | rg -o 'src="[^"]+\.js"'
# expect: src="/assets/index-….js"
curl -sI https://machine-fit.com/assets/index-CNNy_i2F.js | head -1
# after deploy, use the hash from HTML
npm run test:smoke:changed
```

## Production checks
- Wait for Deploy Frontend workflow **success**
- Hard refresh / purge Cloudflare cache if HTML still shows `/machinefit/`

## Ops (still user)
1. Render `FRONTEND_BASE_URL=https://machine-fit.com`
2. `npm run db:migrate` (105)
3. OAuth redirect URIs at domain root
4. Optional Cloudflare redirect `/machinefit*` → `/`

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Black screen; `/machinefit/assets/*.js` 404 | App loads; `/assets/*.js` 200 |
