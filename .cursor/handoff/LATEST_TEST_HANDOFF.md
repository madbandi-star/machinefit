# Move workout report email to Lab; rename LIVE menu

## Summary
Workout report email moved from My Page insights into Lab. Lab CCTV submenu (and KO page title) renamed to ¸Ó½ÅÇÍLIVE.

## Git
- branch: `main`
- commit: pending

## Test focus
1. My Page: workout report email under Lab (not insights)
2. Lab submenu shows ¸Ó½ÅÇÍLIVE (not CCTV)

## Fast checks
```bash
rg -n "WorkoutReportSection|liveDashboard" frontend/src/pages/my-page/MyPage.tsx frontend/src/i18n/locales/ko/common.json
```

## as-is ¡æ to-be
- **as-is:** Workout report under insights; Lab LIVE labeled CCTV
- **to-be:** Workout report under Lab; LIVE labeled ¸Ó½ÅÇÍLIVE
