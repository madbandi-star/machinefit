# Test handoff: Template delete confirm not blocked by day menu

## Summary
일자조회 ⋯ 메뉴에서 템플릿 삭제 시 확인 다이얼로그가 메뉴 뒤에 가려지던 문제를, 확인창을 띄우기 전에 메뉴를 닫아 수정했습니다.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. Mobile (or narrow viewport): Records → day ⋯ → 템플릿 삭제
2. Confirm dialog is visible and tappable (not behind the day menu)
3. Confirm deletes; cancel dismisses without deleting

## Fast checks
```bash
rg -n "onDeleteTemplate|setDayMenuOpen\(false\)" frontend/src/components/records/HistoryListPanel/HistoryListPanel.tsx
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Confirm behind day sheet; can't tap delete | Day sheet closes; confirm on top and usable |
