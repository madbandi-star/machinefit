# Test handoff — TODAY'S WORKOUT complete report

## Summary
Home **오늘 운동 종료** opens confirm, ends the session timer, then shows **TODAY'S WORKOUT** (summary, POWER from ledger, MVP, new record or progress, one-liner, share). Emits `WORKOUT_COMPLETED`. Volume uses `computePerformedTotalWeightKg`. No new POWER grant on end (existing idempotent awards).

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. Timer running → 오늘 운동 종료 → cancel / confirm
2. Numbers match today's logs + timer duration
3. Share card + PC download fallback
4. Rapid confirm clicks → single in-flight complete

## Fast checks
```powershell
Test-Path frontend/src/components/home/WorkoutCompleteReport/WorkoutCompleteHost.tsx
rg -n "WORKOUT_COMPLETED" shared/src/constants/workout-events.ts frontend/src/events/workoutEvents.ts
```

## As-is → To-be
- **As-is:** End only cleared timer
- **To-be:** Finale report + share + extensible event
