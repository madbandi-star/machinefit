# Test handoff: Require workout goal on body metrics save

## Summary
Settings **신체정보** Save without a selected workout goal now shows an error toast and highlights the goal field instead of calling the API.

## Git
- Branch: `main`
- Commit: pending

## Changed files
- `frontend/src/pages/settings/SettingsPage.tsx`
- `frontend/src/i18n/locales/ko/common.json`
- `frontend/src/i18n/locales/en/common.json`

## Test focus
1. Open Settings → 신체정보 (body metrics section).
2. Clear / leave **운동 목표** unselected.
3. Tap **저장** → toast: `운동 목표를 선택해 주세요.` (no success toast).
4. Select a goal → **저장** → success (`프로필을 저장했어요.`).

## Fast checks
```bash
rg -n "workoutGoalRequired" frontend/src/pages/settings/SettingsPage.tsx frontend/src/i18n/locales/ko/common.json
npm run test:smoke:changed
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 미선택 저장 가능 | 미선택 시 안내 토스트 + 저장 차단 |
