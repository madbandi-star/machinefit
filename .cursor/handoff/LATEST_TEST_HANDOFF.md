# Test handoff — Tighten home fortune card spacing

## Summary
홈 오늘의 헬창운세: 우측 상단 날짜 제거, 영역 간 간격 축소.

## Test focus
1. 펼친 카드에 YYYY.MM.DD 없음
2. 키워드·별점·지표·버튼 사이 공백이 이전보다 좁음

## Fast checks
```
rg home-fortune-card__date frontend/src/components/home/HomeFortuneCard/HomeFortuneCard.tsx || true
rg "gap: 0.4rem" frontend/src/styles/fortune.css
```
