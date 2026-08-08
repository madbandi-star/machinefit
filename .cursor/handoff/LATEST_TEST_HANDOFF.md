# Test handoff: Restore Records green-dot on fresh today recommend

## Summary
오늘 운동 추천 직후 하단 기록 녹색점이 다시 켜지도록, 추천 성공 시점에 nudge를 켜고 결과 페이지 unmount cleanup이 점을 끄지 않게 고쳤습니다. 배너 하루 dismiss는 배너만 숨기고 네비 점은 새 추천마다 다시 켭니다.

## Git
- Branch: `main`
- Commit: `150ae612`

## Test focus
1. 오늘 기구 추천 → 결과 화면에서 하단 기록에 녹색점
2. 다른 탭으로 나가도 기록 탭 가기 전까지 녹색점 유지
3. 기록 탭 진입 시 녹색점 해제
4. 배너 X로 닫아도 새 추천 시 네비 점은 다시 동작

## Fast checks
```bash
rg -n "setRecordsNavNudge|recordsNavNudge" frontend/src/hooks/useRecommendMachine.ts frontend/src/pages/recommendation-result/RecommendationResultPage.tsx
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 오늘 첫 추천 후 녹색점 없음 | 추천 성공 시 즉시 녹색점 표시·유지 |
