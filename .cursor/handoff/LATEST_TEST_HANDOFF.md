# Test handoff: Day-group Add exercise CTA on Records

## Summary
기록 페이지 날짜 그룹(펼친 상태) 하단에 「운동추가」를 추가했습니다. 미래 날짜는 `planDate` 검색(이 날짜에 운동계획추가와 동일), 오늘은 일반 검색 페이지로 이동합니다.

## Git
- Branch: `main`
- Commit: `ce0f9860`

## Test focus
1. 미래 날짜 그룹 펼침 → 「운동추가」 → `/machines?planDate=해당일`
2. 오늘 날짜 그룹 펼침 → 「운동추가」 → `/machines` (planDate 없음)
3. 과거 날짜 그룹에는 「운동추가」 없음

## Fast checks
```bash
rg -n "planAddExercise|dayAddExerciseUrl|records-list__day-add" frontend/src/components/records/HistoryListPanel/HistoryListPanel.tsx frontend/src/i18n/locales/ko/machines.json
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 날짜 그룹 내 운동추가 진입점 없음 | 오늘·미래 날짜 카드 영역 하단에 「운동추가」 |
