# Latest test handoff — records voice coach settings UI

**Branch:** `main`  
**Scope:** frontend

## Change

On **records page** (history `WorkoutLogPanel` / expanded card voice coach), hide:

- 목소리 여성/남성 (voice pack)
- 휴식 후 자동 시작
- 휴식 중 주의사항·운동팁 듣기

**My Page → Settings** still exposes all three. Saved values continue to apply on records.

Recommendation/workout page voice coach panel is unchanged (still shows these controls).

## Test focus

1. Records → expand a card → voice coach ON → above controls **not visible**
2. My Page → Settings → voice coach section → all three controls **still visible** and persist
3. Machine recommendation page → voice coach → controls **still visible** (non-history)

## Fast checks

```bash
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
- Backend: not needed
