# Test handoff: Double-tap record card collapses details

## Summary
기록 페이지에서 펼쳐진 운동기록카드를 더블탭하면 상세 내용이 접힙니다. 버튼/링크/입력 영역은 제외합니다.

## Git
- Branch: `main`
- Commit: 047f859a

## Test focus
1. Records → expand a card
2. Double-tap non-control area → details collapse
3. Double-tap on bookmark/buttons/links does not collapse via this gesture

## Fast checks
```bash
rg -n "doubleTapCollapse|useDoubleTapAction" frontend/src/components/records/HistoryRecordCard/HistoryRecordCard.tsx
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Collapse only via header/bottom button | Double-tap also collapses expanded card |
