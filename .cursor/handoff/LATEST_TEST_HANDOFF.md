# Home recent/favorites horizontal scroll

## Summary
Home recent machines and favorites match search muscle-chip horizontal scroll (edge fades + thin scrollbar). Removed the 8-item cap so long lists scroll sideways.

## Git
- branch: `main`
- commit: pending

## Changed files
- `frontend/src/styles/home.css`
- `frontend/src/components/home/RecentMachinesRow/RecentMachinesRow.tsx`
- `frontend/src/components/home/FavoriteMachinesRow/FavoriteMachinesRow.tsx`

## Test focus
1. Many recent/favorite cards ¡æ horizontal scroll works
2. Edge fades + thin scrollbar like search filters
3. More than 8 items can appear

## Fast checks
```bash
rg -n "home-scroll-row-scroller" frontend/src/styles/home.css frontend/src/components/home/RecentMachinesRow/RecentMachinesRow.tsx frontend/src/components/home/FavoriteMachinesRow/FavoriteMachinesRow.tsx
rg -n "slice\\(0, 8\\)" frontend/src/components/home/RecentMachinesRow frontend/src/components/home/FavoriteMachinesRow || true
```

## As-is ¡æ To-be
- **As-is:** Cap at 8, scrollbar hidden
- **To-be:** Search-style horizontal scroller for full rows
