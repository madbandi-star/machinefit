# Latest test handoff — 셋팅값 저장하기 on bad button

**Branch:** `main`  
**Scope:** frontend

## Change

Records card feedback button:

1. **셋팅값 조정 필요** — enter adjustment edit mode (unchanged first tap)
2. While editing → label **셋팅값 저장하기**
3. Tap **셋팅값 저장하기** → same as bottom **저장하기** (adjustment prefs + workout log + compare view)

## Test focus

1. Expand card → 셋팅값 조정 필요 → text switches to 셋팅값 저장하기
2. Tap 셋팅값 저장하기 → full save + read-only compare
3. Recommendation result page → bad button unchanged

## Fast checks

```bash
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
- Backend: not needed
