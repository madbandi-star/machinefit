# Test handoff ? Tighten summary ? date gap (Records)

## Summary
?? ????? `[???][???]?[????]` ?? ??? ? ???? ?? ?? ??? ??. CSS only.

## Git
- branch: `main`
- commit: `ecd44a9b`

## Changed files
- `frontend/src/styles/history-premium.css`
- `frontend/src/styles/records.css`

## Test focus
1. Records with cards ? summary metrics visible; gap above first date heading looks tight (not a large empty band).
2. Toolbar `[??][???]?` still usable.
3. Multiple date groups still readable (prior date-to-date tighten intact).

## Fast checks (no Pages wait)
```bash
rg -n "history-dashboard \+ \.records-list__date-group" frontend/src/styles/history-premium.css frontend/src/styles/records.css
rg -n "records-list--history" frontend/src/styles/records.css | head -n 20
```

## Production checks
After Deploy Frontend success: open Records and confirm summary sits close to first date.

## as-is ? to-be
- **as-is:** Wide empty space between summary stats and workout date.
- **to-be:** Tight spacing via list gap + stronger negative margin on first date group after `.history-dashboard`.
