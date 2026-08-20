# Test handoff: Long-press card reorder (no grip)

## Summary
Grip handle removed. Same-day reorder: long-press card (~420ms) → drag to another card → release.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. Long-press card body (not buttons/links) → drag → drop on another same-day card → order updates
2. Grip gone; ↑↓ menu and normal taps still work

## Fast checks
- No `GripVertical` / `drag-handle` in `HistoryRecordCard.tsx`
- Long-press timeout `420` present

## As-is → To-be
- **As-is:** Drag via grip handle
- **To-be:** Long-press card then drop to reorder
