# Test handoff — Timer history today label + spacing

## Summary
타이머 기록 페이지에서 선택일이 오늘이면 「오늘 · 날짜」로 표시. 달력과 날짜 헤더 사이 여백 추가.

## Test focus
1. 타이머 기록 열기 (기본 오늘)
2. 헤더가 「오늘 · …」인지
3. 다른 날짜 선택 → 일반 날짜만
4. 달력과 날짜 헤더 간격이 넉넉한지

## Fast checks
```
rg -n "selectedToday" frontend/src/pages/timer-history/TimerHistoryPage.tsx
rg -n "margin-top: 0.85rem" frontend/src/styles/timer-history.css
```

## Deploy note
Frontend only (Pages).
