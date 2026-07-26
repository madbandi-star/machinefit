# Latest test handoff — Settings collapsible sections

**Branch:** `main`  
**Scope:** frontend

## Change

My Page → Settings: each form section is collapsible (chevron toggle).

- **Default:** collapsed
- **ProfileSummaryCard** / **ProUpgradeCard:** unchanged (always visible)
- **`#location-settings`:** auto-expands + scrolls (from My Page location link)

## Test focus

1. Open Settings → all sections collapsed (title + chevron only)
2. Tap section header → expands; tap again → collapses
3. My Page → location link → `/settings#location-settings` expands location section
4. Save buttons / reset / delete still work when expanded

## Fast checks

```bash
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
- Backend: not needed
