# Test handoff ? Tighten Records header ? toolbar gap

## Summary
?? ????? ? ??(??? ?)? `[??][???]??` ?? ?? ?? ??? ??.

## Git
- branch: `main`
- commit: PENDING

## Changed files
- `frontend/src/pages/records/RecordsPage.tsx`
- `frontend/src/styles/records.css`

## Test focus
1. Records ? toolbar close under MachineFit header
2. Favorites top spacing unchanged
3. Missed-plans banner (if any) still OK

## Fast checks
```bash
rg -n "records-page--history" frontend/src/pages/records/RecordsPage.tsx frontend/src/styles/records.css
```

## as-is ? to-be
- **as-is:** Large empty band above filter toolbar
- **to-be:** Tight top padding on Records only
