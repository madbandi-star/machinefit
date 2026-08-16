# Home missed-plans: dismiss only

## Summary
홈 놓친 운동 계획에서 **오늘로 / 날짜 / 삭제** 버튼을 제거했습니다. **무시**만 남습니다.

## Git
- branch: `main`
- commit: `74dd6d0b`

## Changed files
- `frontend/src/components/home/HomePlannedWorkoutCard/HomePlannedWorkoutCard.tsx`
- `frontend/src/styles/home.css`

## Test focus
1. 놓친 계획 스트립에 `무시`만 있음
2. `오늘로` / `날짜` / `삭제` 없음
3. `무시` 동작 확인

## Fast checks
```bash
rg -n "move_today|planMissedMoveToday|PlanDatePickerDialog" frontend/src/components/home/HomePlannedWorkoutCard/HomePlannedWorkoutCard.tsx || true
rg -n "planMissedDismiss" frontend/src/components/home/HomePlannedWorkoutCard/HomePlannedWorkoutCard.tsx
```

## As-is → To-be
- **As-is:** 오늘로 / 날짜 / 삭제 / 무시
- **To-be:** 정보 표시 + 무시만
