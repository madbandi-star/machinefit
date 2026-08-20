# Test handoff: Records order menu + drag reorder

## Summary
Order-move panel is fixed to the trigger and clamped inside the viewport (no left-edge overflow). Same-day cards can also be reordered by dragging the grip handle.

## Git
- Branch: `main`
- Commit: `abfa92b6`

## Changed files
- `frontend/src/components/records/HistoryListPanel/HistoryListPanel.tsx`
- `frontend/src/components/records/HistoryRecordCard/HistoryRecordCard.tsx`
- `frontend/src/styles/records.css`
- `frontend/src/styles/history-premium.css`
- `frontend/src/utils/workoutCardOrder.ts`
- `frontend/src/utils/workoutCardOrder.test.ts`
- `frontend/src/i18n/locales/*/machines.json` (orderDragAria)

## Test focus
1. Records → open ↑↓ order button → menu fully visible (not past left screen edge)
2. Records → drag grip (⋮⋮) within same day → drop → order updates and persists

## Fast checks
- `grep createPortal HistoryRecordCard.tsx`
- `grep history-record-card__drag-handle HistoryRecordCard.tsx`
- `cd frontend && npx vitest run src/utils/workoutCardOrder.test.ts`

## As-is → To-be
- **As-is:** Order menu overflowed left; reorder only via buttons.
- **To-be:** Viewport-clamped portal menu; grip drag-and-drop for same-day reorder.
