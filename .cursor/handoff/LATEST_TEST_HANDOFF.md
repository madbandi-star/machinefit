# Missed plans date shows weekday

## Summary
Home missed-plans date now shows compact `MM-DD(weekday)`, e.g. `08-15(≈‰)`.

## Git
- branch: `main`
- commit: `52224e4f`

## Changed files
- `frontend/src/components/home/HomePlannedWorkoutCard/HomePlannedWorkoutCard.tsx`
- `frontend/src/utils/historyDate.ts` (`formatShortDateWithWeekday`)

## Test focus
1. Missed plan date format is `MM-DD(weekday)`
2. Dismiss still works

## Fast checks
```bash
rg -n "formatShortDateWithWeekday" frontend/src/utils/historyDate.ts frontend/src/components/home/HomePlannedWorkoutCard/HomePlannedWorkoutCard.tsx
```

## As-is °Ê To-be
- **As-is:** `08-15`
- **To-be:** `08-15(≈‰)`
