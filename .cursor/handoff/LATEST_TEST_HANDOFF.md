# Test handoff: Double-tap detail → back to records

## Summary
기록 카드에서 연 세부기록(주의사항·운동팁) 페이지를 더블탭하면 해당 일자 기록 목록으로 돌아갑니다. 버튼/입력 영역은 제외합니다.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. Records → card → detail (tips/warnings)
2. Double-tap empty/content area → returns to `/records?date=...`
3. Double-tap on bookmark/favorite/inputs does NOT navigate away

## Fast checks
```bash
rg -n "useDoubleTapAction|returnToRecords" frontend/src/pages/recommendation-result frontend/src/hooks/useDoubleTapAction.ts
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| No double-tap back | Double-tap detail returns to records list for that date |
