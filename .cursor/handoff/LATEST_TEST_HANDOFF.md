# Missed plans date shows weekday

## Summary
홈 놓친 운동 계획 날짜를 `08-15(토)`처럼 **월-일(요일)** 로 표시합니다.

## Git
- branch: `main`
- commit: pending

## Changed files
- `frontend/src/components/home/HomePlannedWorkoutCard/HomePlannedWorkoutCard.tsx`
- `frontend/src/utils/historyDate.ts` (`formatShortDateWithWeekday`)

## Test focus
1. 놓친 계획 날짜가 `MM-DD(요일)` 형식
2. 무시 동작 유지

## Fast checks
```bash
rg -n "formatShortDateWithWeekday" frontend/src/utils/historyDate.ts frontend/src/components/home/HomePlannedWorkoutCard/HomePlannedWorkoutCard.tsx
```

## As-is → To-be
- **As-is:** `08-15`
- **To-be:** `08-15(토)`
