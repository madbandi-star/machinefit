# Latest test handoff — records voice coach 2–4 column pickers + hold

**Branch:** `main`  
**Scope:** frontend

## Change

Records page voice coach picker row (dynamic columns from settings):

| Settings | Columns |
|----------|---------|
| Count only | 목표 횟수 + 카운트 간격 (2) |
| + one-more | + 원모어 횟수 (3) |
| + hold after count | + 버텨!!! 시간 (3) |
| + both | 4 columns |
| Hold only | 버텨!!! 시간 (1) |

Hold duration moved into picker grid; separate hold block removed on records.

## Test focus

1. Settings combos above → correct column count on records expanded voice coach
2. Hold picker editable; values persist
3. Recommendation page → still 3 pickers + separate hold select below

## Fast checks

```bash
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
- Backend: not needed
