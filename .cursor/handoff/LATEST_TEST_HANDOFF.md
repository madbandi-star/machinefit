# Test handoff: Today add-exercise uses planDate for 추가됨 badges

## Summary
기록 페이지 오늘 「운동추가」도 검색 URL에 `planDate=오늘`을 포함해, 이미 등록된 기구에 미래와 동일하게 「추가됨」 라벨이 보이게 했습니다.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. 오늘 날짜 「운동추가」 → URL에 `planDate=오늘`
2. 오늘 이미 있는 기구에 「추가됨」 배지 표시
3. 미래 「운동추가」 동작/배지 회귀 없음

## Fast checks
```bash
rg -n "Include planDate for today|planDate=\\$\\{encodeURIComponent\\(groupDateKey\\)\\}" frontend/src/components/records/HistoryListPanel/HistoryListPanel.tsx
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 오늘 운동추가에 「추가됨」 없음 | 오늘도 planDate로 「추가됨」 표시 |
