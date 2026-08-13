# Test handoff — TODAY'S WORKOUT share random each time

## Summary
운동 종료 공유를 **누를 때마다** 시안 10종 중 다른 디자인이 나옵니다(셔플 백: 10개 소진 전 중복 없음).

## Git
- Branch: `cursor/today-workout-share-random-35b3`

## Changed files
- `frontend/src/utils/workoutCompleteShareThemes.ts`
- `frontend/src/utils/workoutCompleteShareCard.ts`

## Test focus
1. 같은 세션에서 공유를 여러 번 → 연속 카드 디자인이 달라짐
2. 10번 공유하면 10종을 한 번씩 거친 뒤 다시 섞임
3. duration / exercises / sets / volume / POWER / KEEP GOING 데이터는 동일

## Fast checks
```powershell
rg -n "shuffle bag|pickRandomWorkoutShareTheme" frontend/src/utils/workoutCompleteShareThemes.ts
```
