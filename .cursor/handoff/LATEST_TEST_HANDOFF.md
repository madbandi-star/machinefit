# Test handoff: Records green-dot on workout detail page

## Summary
기록에서 연 상세운동기록 페이지에서도 하단 기록 버튼에 녹색점이 켜지도록 했습니다. 팁 말풍선은 신규 추천 시에만 표시됩니다.

## Git
- Branch: `main`
- Commit: `fdde4ddc`

## Test focus
1. 기록 → 상세운동기록: 하단 기록에 녹색점(팁 없음)
2. 오늘 신규 추천 결과: 녹색점 + 「이동해서 운동시작」팁
3. 기록 탭 진입 시 녹색점 해제

## Fast checks
```bash
rg -n "setRecordsNavNudge|recordsNavNudgeTip|tip: isFreshRecommend" frontend/src/store/ui.store.ts frontend/src/pages/recommendation-result/RecommendationResultPage.tsx frontend/src/components/layout/BottomNavigation/BottomNavigation.tsx
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 기록→상세에서 녹색점 없음 | 상세에서도 녹색점 표시 |
