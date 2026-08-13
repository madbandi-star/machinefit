# Test handoff — Today template apply starts incomplete

## Summary
당일 날짜에 템플릿 가져오기 시 카드/수행세트가 COMPLETED(전부 완료)로 생성되던 것을 PLANNED(미완료)로 변경. 미래와 동일. 과거 날짜만 기본 COMPLETED 유지.

## Test focus
1. 오늘 날짜에 템플릿 적용 → 세트 전부 미완료
2. 미래 날짜 템플릿 적용 → 미완료 유지
3. (선택) 과거 날짜 적용 → 기존처럼 완료 가능

## Fast checks
```
rg -n "scheduledDate >= today|defaultStatusForDate" backend/server/services/workout-card.service.ts
```

## Deploy note
backend 변경 → Render 재배포 필요
