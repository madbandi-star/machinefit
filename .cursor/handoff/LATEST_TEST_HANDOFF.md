# Test handoff: Fix stretched settings tiles on some mobiles

## Summary
기록카드 추천중량·추천횟수·가동범위가 특정 모바일에서 가로로 길게 늘어지던 문제를 수정했습니다. `content-visibility:auto` 제거, 설정 그리드/타일 `min-width:0`·폭 제한, 비교 행 세로 스택으로 맞췄습니다.

## Git
- Branch: `main`
- Commit: e4040322

## Test focus
1. Records on a previously broken narrow Android device/WebView
2. Weight / reps / ROM tiles stay in a 3-column grid inside the card (no horizontal stretch)
3. Other card UI still normal; compare/adjust mode still usable

## Fast checks
```bash
rg -n "content-visibility|minmax\\(0, 1fr\\)|overflow-x: clip" frontend/src/styles/records.css frontend/src/styles/history-premium.css frontend/src/styles/recommendation.css
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Settings tiles stretched in one long horizontal strip on some phones | Contained 3-column grid within card width |
