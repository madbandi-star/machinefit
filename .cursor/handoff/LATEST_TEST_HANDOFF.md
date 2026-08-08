# Test handoff: Collapse details button on record cards

## Summary
기록 페이지 개별 운동기록카드 하단에 펼친 상태일 때 「상세 내용 접기」 버튼을 추가했습니다. 접힌 상태의 「상세 내용 펼치기」는 그대로입니다.

## Git
- Branch: `main`
- Commit: 455aedd7

## Test focus
1. Records → expand a card (or open already expanded)
2. Bottom shows 「상세 내용 접기」 → tap collapses details
3. Collapsed card still shows 「상세 내용 펼치기」 at bottom

## Fast checks
```bash
rg -n "collapseCardDetails" frontend/src/components/records/HistoryRecordCard/HistoryRecordCard.tsx
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Only expand at bottom when collapsed | Collapse button at bottom when expanded too |
