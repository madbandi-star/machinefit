# Test handoff: Hide MY WORKOUT DATA sections

## Summary
`/fortune/today`에서 📊 MY WORKOUT DATA(차트/통계)와 📊 내 운동 데이터 분석 본문을 제거했습니다. ✨ TODAY'S RECOMMENDATION 이후는 그대로입니다.

## Git
- Branch: `main`
- Commit: `ad588863`

## Test focus
1. MY WORKOUT DATA / donut / 데이터 분석 섹션 없음
2. TODAY'S RECOMMENDATION부터 하단까지 정상

## Fast checks
```bash
rg -n "sectionDataVisual|EquipmentDonutChart|dataNarrative" frontend/src/components/fortune/FortuneDashboard.tsx || true
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 데이터 차트+분석 표시 | 해당 두 영역 제거, 추천 이하 유지 |
