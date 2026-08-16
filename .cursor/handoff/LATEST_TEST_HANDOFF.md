# Move workout report email to Lab; rename LIVE menu

## Summary
Workout report email moved from My Page insights into Lab. Lab CCTV submenu (and KO page title) renamed to �ӽ���LIVE.

## Git
- branch: `main`
- commit: `442a34a4`

## Test focus
1. My Page: workout report email under Lab (not insights)
2. Lab submenu shows �ӽ���LIVE (not CCTV)

## Fast checks
```bash
rg -n "WorkoutReportSection|liveDashboard" frontend/src/pages/my-page/MyPage.tsx frontend/src/i18n/locales/ko/common.json
```

## as-is �� to-be
- **as-is:** Workout report under insights; Lab LIVE labeled CCTV
- **to-be:** Workout report under Lab; LIVE labeled �ӽ���LIVE
