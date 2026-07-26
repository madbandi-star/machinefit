# Latest test handoff — personalTipSaveHint punctuation

**Branch:** `main`  
**Commit:** `c2625ce`  
**Scope:** frontend i18n only

## Change

Update `history.personalTipSaveHint` (KO):

- **as-is:** `아래 「저장하기」로 운동일지와 함께 저장됩니다.`
- **to-be:** `아래 「저장하기」로 운동일지와 함께 저장됩니다..`

## Test focus

- History card / workout log panel: personal tip save hint shows the double-period copy.

## Fast checks

```bash
rg "personalTipSaveHint" frontend/src/i18n/locales/ko/machines.json
npm run test:smoke:changed
```

## Deploy

- Frontend: GitHub Pages (push to `main` — triggered)
- Backend: not needed
