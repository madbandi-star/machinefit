# Latest test handoff — records save UI cleanup

**Branch:** `main`  
**Scope:** frontend

## Change

1. Remove **조정값 저장** from records card top (`FitFeedbackPanel`)
2. Enlarge bottom **저장하기** — full width, standard button height

Adjustment prefs still save via bottom **저장하기** / bookmark when edits are dirty.

## Test focus

1. 셋팅값 조정 필요 → edit weight/reps → no top save button
2. Bottom 저장하기 → prefs + workout log saved
3. Save button visually larger, full card width

## Fast checks

```bash
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
- Backend: not needed
