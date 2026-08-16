# Test handoff — Align home workout report with Records totals

## Summary
Home TODAY'S WORKOUT report now uses the same set-count filter, free-weight muscle identity, and fitRating volume reps as the Records day summary so 종목/총세트/총볼륨 match.

## Git
- Branch: `main`
- Commit: `fc5becee`

## Changed files
- `shared/src/utils/effective-load.ts` (+ exported `countPerformedSets`)
- `shared/src/utils/workout-complete-report.ts`
- `frontend/src/utils/historySummaryStats.ts`
- `frontend/src/services/workoutCompleteReport.service.ts`
- tests under `shared/src/utils/*.test.ts`

## Test focus
1. End session → home report exercises / sets / volume.
2. Open Records with `?date=today` — summary sets & volume match the report for the same logs.
3. Logs with some incomplete sets: both count only completed when any `setCompleted` is true.
4. Same-day FW dumbbell chest + back → report exercise count 2.

## Fast checks
```bash
node --import tsx --test shared/src/utils/effective-load.test.ts shared/src/utils/workout-complete-report.test.ts
rg -n "countPerformedSets|fitRating|exerciseAggregateKey|buildLogVolumeContexts" shared/src/utils/effective-load.ts shared/src/utils/workout-complete-report.ts frontend/src/utils/historySummaryStats.ts frontend/src/services/workoutCompleteReport.service.ts
```

## as-is → to-be
| as-is | to-be |
| --- | --- |
| Home sets from any completed flags; Records always `setCount` | Shared `countPerformedSets` (volume filter) |
| Home volume ignored fitRating | Home loads feedback like Records |
| Home FW merged by machine only | Split by target muscle like Records cards |

## Deploy
Frontend Pages only (shared is bundled into the frontend build).
