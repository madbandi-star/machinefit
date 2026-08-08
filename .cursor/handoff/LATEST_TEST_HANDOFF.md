# Test handoff: Remove calendar “날짜 직접 선택”

## Summary
기록 페이지 일자조회 캘린더에서 [오늘] 옆의 [날짜 직접 선택] 칩과 네이티브 date input을 제거했습니다. 날짜는 캘린더 칸으로만 고릅니다.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. Records → 일자조회 → calendar opens
2. [오늘] may still appear; [날짜 직접 선택] is gone
3. Day cells still selectable

## Fast checks
```bash
rg -n "planPickAnyDate|openNativePicker|history-plan-date-input" frontend/src/components/records/HistoryDateCalendar || true
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Today + “날짜 직접 선택” | Today only (when needed); pick days on grid |
