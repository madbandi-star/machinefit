# Test handoff: Card ? menu portal (not clipped by card)

## Summary
기구 기록카드 ? 메뉴가 카드의 backdrop-filter에 갇혀 잘리던 문제를 `document.body` 포탈로 수정했습니다.

## Git
- Branch: `main`
- Commit: 3e32902f

## Test focus
1. Mobile: Records → card ?
2. Full-screen centered panel (not clipped inside the card)
3. 날짜 변경 / 다른 날짜로 복사 탭 가능 → date picker opens

## Fast checks
```bash
rg -n "createPortal|document.body" frontend/src/components/records/HistoryCardPlanActionsSheet/HistoryCardPlanActionsSheet.tsx
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Menu clipped inside card; hard to tap | Full viewport overlay via portal |
