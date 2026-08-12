# Test handoff — Fully revert fortune birth-gate polish

## Summary
`/fortune/today` 생년월일 미입력 화면도 홈과 같이 원래 심플 UI(🔮 + 문구 + CTA)로 되돌렸습니다. `FortuneBirthGate`·관련 문구/CSS 제거.

## Test focus
1. `/fortune/today` 게이트: 커스텀 구슬·잠금 프리뷰·「탄생시를 몰라도…」 없음
2. 홈 운세 게이트도 심플 유지

## Fast checks
```
rg FortuneBirthGate frontend/src || true
rg fortune-gate frontend/src/pages/fortune/FortuneDetailPage.tsx
```

## as-is → to-be
- as-is: 히어로 게이트 폴리스
- to-be: 기존 fortune-gate
