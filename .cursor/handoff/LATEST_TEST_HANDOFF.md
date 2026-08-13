# Test handoff — TODAY'S WORKOUT share 10 random themes

## Summary
운동 종료 공유 카드가 시안 10종 중 **랜덤** 디자인을 씁니다. 리포트/캡션/공유 플로우(비즈니스 로직)는 변경 없음.

## Git
- Branch: `main`
- Commit: _(after push)_

## Changed files
- `frontend/src/utils/workoutCompleteShareThemes.ts`
- `frontend/src/utils/workoutCompleteShareCard.ts`
- `frontend/public/assets/share/workout/*.png` (cinematic + industrial)

## Test focus
1. 공유 PNG에 duration / exercises / sets / volume / POWER / KEEP GOING 유지
2. 여러 번 공유 시 디자인이 바뀜 (10종 풀)
3. 숫자·캡션은 리포트와 동일

## Fast checks
```powershell
rg -n "pickRandomWorkoutShareTheme" frontend/src/utils
(Get-Content frontend/src/utils/workoutCompleteShareThemes.ts | Select-String 'id:').Count  # 10
```

## As-is → To-be
- **As-is:** 단일 슬레이트/그린 카드
- **To-be:** 시안 10종 랜덤 비주얼
