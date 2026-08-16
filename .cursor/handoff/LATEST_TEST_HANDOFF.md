# Move home gym+member selector above notices

## Summary
Home page gym selector and member name now sit directly above the notice banner.

## Git
- branch: `main`
- commit: pending

## Test focus
1. Home (premium+): gym+member row appears above `HomeNoticeBanner`

## Fast checks
```bash
rg -n "home-gym-selector|HomeNoticeBanner" frontend/src/pages/home/HomePage.tsx
```

## as-is ¡æ to-be
- **as-is:** Gym+member below notice and planned workout
- **to-be:** Gym+member immediately above notice banner
