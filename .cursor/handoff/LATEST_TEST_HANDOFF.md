# Test handoff — Remove lifetime spent from Helchang Power page

## Summary
내 헬창력에서 「누적 사용 …Power」 문구를 삭제했습니다. 「누적 적립 …Power」만 표시됩니다.

## Test focus
1. 헬창력 페이지 상단 lifetime 줄에 사용(spent) 문구 없음

## Fast checks
```
rg "누적 적립" frontend/src/i18n/locales/ko/common.json
rg lifetimeSpent frontend/src/pages/points/PointsPage.tsx || true
```

## as-is → to-be
- as-is: 누적 적립 · 누적 사용
- to-be: 누적 적립만
