# Test handoff — TODAY'S WORKOUT report UI refresh

## Summary
운동 종료 리포트 시트를 첨부 시안(네온 라임 / 게이지 / 3열 통계 / POWER 링 / 인용 / 공유 CTA)에 맞게 UI 개편.

## Git
- Branch: `cursor/workout-complete-report-ui-35b3`

## Changed files
- `frontend/src/components/home/WorkoutCompleteReport/WorkoutCompleteReportModal.tsx`
- `frontend/src/styles/workout-complete.css`
- `frontend/src/i18n/locales/{ko,en,ja,zh}/common.json`

## Test focus
1. 홈에서 운동 종료 → 리포트 시트: 배경/타이틀/게이지/3통계/POWER/한마디/공유·완료 버튼
2. 모바일 폭(~360)에서도 깨지지 않음
3. 공유 플로우 동작 유지
