# Test handoff: Reorder records nudge + fix bottom-nav tip bubble

## Summary
추천 결과에서 기록 안내 배너를 핏 피드백(기본값 설정) 위로 옮기고, 하단 기록 탭 팁을 아이콘에 갇히지 않는 2줄 말풍선으로 고쳤습니다.

## Git
- Branch: `main`
- Commit: `0ee64688`

## Test focus
1. 추천 결과: 「오늘 운동은 기록에서…」가 「아래 버튼을 눌러 기본값을…」 위에 표시
2. 하단 기록 탭 팁이 2줄 말풍선으로 표시(글자 세로 일자 나열 아님)

## Fast checks
```bash
rg -n "recordsNudgeVisible|bottom-nav__nudge-tip|pre-line" frontend/src/pages/recommendation-result/RecommendationResultPage.tsx frontend/src/components/layout/BottomNavigation
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 기록 배너가 핏 피드백 아래 + 네비 팁 깨짐 | 기록 배너 위쪽 + 2줄 말풍선 팁 |
