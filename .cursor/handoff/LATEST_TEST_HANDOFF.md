# Test handoff: Show 추가됨 badge for today’s history/logs too

## Summary
검색/운동추가 목록의 「추가됨」이 workout_cards뿐 아니라 해당일 history·workout_logs까지 보도록 해서, 오늘 추천으로 이미 넣은 기구에도 미래와 같이 배지가 붙습니다. 일반 검색은 오늘 기준으로 표시합니다.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. 오늘 추천한 기구 → 검색: 「추가됨」
2. 오늘 운동추가로 넣은 기구 → planDate 검색: 「추가됨」
3. 미래 planDate: 기존 「추가됨」 유지
4. 배너 count가 history+card+log 합과 일치

## Fast checks
```bash
rg -n "dayHistory|dayLogs|badgeDate|plannedCount" frontend/src/pages/machine-search/MachineSearchPage.tsx
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 오늘 기구는 history에만 있어 배지 없음 | 오늘도 history/log/card로 「추가됨」 |
