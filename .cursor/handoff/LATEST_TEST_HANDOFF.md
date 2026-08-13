# Test handoff — TODAY'S WORKOUT report UI + random share

## Summary
1. 운동 종료 리포트 시트를 네온 라임 시안에 맞게 UI 개편
2. 공유 PNG는 시안 10종 셔플 백(연속 중복 없음)

## Git
- Merged to `main` (report UI + share shuffle)

## Changed files
- `frontend/src/components/home/WorkoutCompleteReport/WorkoutCompleteReportModal.tsx`
- `frontend/src/styles/workout-complete.css`
- `frontend/src/i18n/locales/{ko,en,ja,zh}/common.json`
- `frontend/src/utils/workoutCompleteShareThemes.ts`
- `frontend/src/utils/workoutCompleteShareCard.ts`

## Test focus
1. 홈 → 운동 종료 → 리포트 시트 구성(게이지/3통계/POWER/한마디/CTA)
2. 공유를 여러 번 → PNG 테마가 매번 달라짐
3. 좁은 폭(~360) 레이아웃
