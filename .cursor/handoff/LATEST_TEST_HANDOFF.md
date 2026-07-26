# Latest test handoff — save → adjustment compare view

**Branch:** `main`  
**Scope:** frontend

## Change

In **셋팅값 조정 필요** editing mode, **저장하기** / bookmark now always:

1. Saves adjustment prefs (when applicable)
2. Switches to **추천 vs 조정** read-only compare
3. Saves workout log

No longer requires `settingsDirty` to finalize.

## Test focus

1. Tap 셋팅값 조정 필요 → 저장하기 → compare view (even without editing values)
2. Edit 조정중량 → 저장하기 → compare + log saved
3. Bookmark save same behavior

## Fast checks

```bash
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
- Backend: not needed
