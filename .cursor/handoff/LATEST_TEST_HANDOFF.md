# Test handoff: Require workout goal on body metrics save

## Summary
Settings **? ì²´?•ë³´** Save without a selected workout goal now shows an error toast and highlights the goal field instead of calling the API.

## Git
- Branch: `main`
- Commit: bace37e2

## Changed files
- `frontend/src/pages/settings/SettingsPage.tsx`
- `frontend/src/i18n/locales/ko/common.json`
- `frontend/src/i18n/locales/en/common.json`

## Test focus
1. Open Settings ??? ì²´?•ë³´ (body metrics section).
2. Clear / leave **?´ë™ ëª©í‘œ** unselected.
3. Tap **?€??* ??toast: `?´ë™ ëª©í‘œë¥?? íƒ??ì£¼ì„¸??` (no success toast).
4. Select a goal ??**?€??* ??success (`?„ë¡œ?„ì„ ?€?¥í–ˆ?´ìš”.`).

## Fast checks
```bash
rg -n "workoutGoalRequired" frontend/src/pages/settings/SettingsPage.tsx frontend/src/i18n/locales/ko/common.json
npm run test:smoke:changed
```

## as-is ??to-be
| as-is | to-be |
|-------|--------|
| ë¯¸ì„ ???€??ê°€??| ë¯¸ì„ ?????ˆë‚´ ? ìŠ¤??+ ?€??ì°¨ë‹¨ |
