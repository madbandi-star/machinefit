# Test handoff: Motivation video overlay UI

## Summary
Header **video play** overlay restyled to match the music mini-player (MachineFit glass + primary green). Includes watching meta, Next/Close transport, and a playlist when multiple videos exist.

## Git
- Branch: `main`
- Commit: `c192aafb`

## Changed files
- `frontend/src/components/motivation/MotivationMediaControls/MotivationMediaControls.tsx`
- `frontend/src/components/motivation/MotivationMediaControls/MotivationMediaControls.css`
- `frontend/src/i18n/locales/ko/common.json`
- `frontend/src/i18n/locales/en/common.json`

## Test focus
1. Header video button opens the new glass panel UI
2. YouTube embed still autoplays
3. Next / Close / Esc / backdrop dismiss
4. With 2+ videos, playlist switches the active video

## Fast checks
```bash
npm run test:smoke:changed
rg -n "mf-video-overlay" frontend/src/components/motivation/MotivationMediaControls
```

## Production checks
After Pages deploy: Ctrl+F5, open header video UI (no backend redeploy).

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Small plain modal + generic Next | Glass video player matching music panel tone |
