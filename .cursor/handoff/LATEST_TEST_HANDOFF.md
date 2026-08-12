# Test handoff — Helchang Power page UI polish

## Summary
내 헬창력 부제 「적립·사용 내역을 확인하세요.」 삭제. 잔액 히어로 + 내역 리스트로 UI 개선.

## Test focus
1. 부제 없음
2. 상단: 현재 헬창력 + 누적 적립
3. 내역: +/− 구분, 설명·시간·금액

## Fast checks
```
rg points.subtitle frontend/src/pages/points/PointsPage.tsx || true
rg points-hero frontend/src/pages/points/PointsPage.css
```

## as-is → to-be
- as-is: card + list-nav + subtitle
- to-be: hero + ledger, no subtitle
