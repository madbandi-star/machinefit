# Test handoff — Home notice / fortune spacing

## Summary
홈 공지 배너와 오늘의 헬창운세가 여백 없이 붙던 문제에 `home-notice-banner` 하단 여백 `0.75rem` 추가.

## Test focus
1. 홈에서 공지 배너 표시 + (오늘 계획/미완료 배너 없음) → 운세 카드 위 간격이 적당히 떨어짐
2. 너무 벌어지지 않음 (대략 12px)

## Fast checks
```
rg -n "margin: 0 0 0.75rem" frontend/src/styles/notices.css
```

## As-is → To-be
- as-is: 공지·운세 딱 붙음
- to-be: 공지 아래 적당한 여백
