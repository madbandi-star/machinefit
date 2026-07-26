# Latest test handoff — records voice coach picker grid

**Branch:** `main`  
**Scope:** frontend

## Change

Records page voice coach picker row:

- **One-more OFF** (My Page → Settings): 2 columns — 목표 횟수 + 카운트 간격 (no empty right gap)
- **One-more ON**: 3 columns — 목표 횟수 + 카운트 간격 + 원모어 횟수 (matches Settings layout)

## Test focus

1. Settings: disable one-more → records expanded voice coach → 2 pickers, balanced width
2. Settings: enable one-more → records → 3 pickers visible
3. Recommendation page voice coach → still 3 pickers

## Fast checks

```bash
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
- Backend: not needed
