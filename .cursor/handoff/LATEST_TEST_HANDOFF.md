# Test handoff — Revert home fortune gate visual extras

## Summary
홈 `[오늘의 헬창운세]` 미입력 카드에서 CSS 구슬·「탄생시를 몰라도…」문구를 제거해 이전처럼 🔮 + 본문 + CTA만 보이게 복구했습니다. (`/fortune/today` 게이트 페이지 개선은 유지)

## Test focus
1. 홈 운세 게이트: 🔮, `needsBirth` 문구, 입력 CTA
2. 「탄생시를 몰라도…」 없음

## Fast checks
```
rg gateNote frontend/src/components/home/HomeFortuneCard/HomeFortuneCard.tsx || true
rg home-fortune-card__gate-emoji frontend/src/styles/fortune.css
```

## as-is → to-be
- as-is: 커스텀 구슬 + 헤드라인 + gateNote
- to-be: 🔮 + needsBirth + CTA
