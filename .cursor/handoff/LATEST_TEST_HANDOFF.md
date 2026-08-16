# Workout plan reminder copy update

## Summary
Workout plan reminder body changed to `???오늘 예정된 운동이 있습니다.???` (no count).

## Git
- branch: `main`
- commit: pending

## Changed files
- `backend/server/services/workout-card.service.ts`

## Test focus
1. New Korean copy (and EN equivalent)
2. Reminder still once/day when eligible

## Fast checks
```bash
rg -n "오늘 예정된 운동이 있습니다" backend/server/services/workout-card.service.ts
```

## As-is → To-be
- **As-is:** `오늘 예정된 운동이 N개 있습니다.`
- **To-be:** `???오늘 예정된 운동이 있습니다.???`

## Note
Backend change ? Render redeploy required for production.
