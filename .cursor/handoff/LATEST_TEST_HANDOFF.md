# Test handoff ? Fullscreen records date calendar

## Summary
?? ??? **????** ?? ? ??? ?? ?? **?? ?? ??** ??? ??. ?? ?? ? ??? ?? ?? ??.

## Git
- branch: `main`
- commit: PENDING

## Changed files
- `frontend/src/components/records/HistoryDateCalendarDialog/HistoryDateCalendarDialog.tsx` (new)
- `frontend/src/components/records/HistoryDateCalendarDialog/HistoryDateCalendarDialog.css` (new)
- `frontend/src/components/records/HistoryListPanel/HistoryListPanel.tsx`
- `frontend/src/styles/records.css`
- `frontend/src/styles/history-premium.css`

## Test focus
1. Records ? ???? ? ??(? ???)? ??? ??
2. ?? ? ? ?? ?? + `?date=` ??
3. X / ?? / Escape? ??
4. ?? ? ????? ?? ??

## Fast checks
```bash
rg -n "HistoryDateCalendarDialog" frontend/src/components/records/HistoryListPanel/HistoryListPanel.tsx
rg -n "history-calendar-dialog" frontend/src/components/records/HistoryDateCalendarDialog/HistoryDateCalendarDialog.css
```

## as-is ? to-be
- **as-is:** Toolbar ?? ?? ??? ??
- **to-be:** Fullscreen calendar dialog
