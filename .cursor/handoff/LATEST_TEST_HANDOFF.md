# Test handoff — All-sets complete toggle

## Summary
Icon-only toggle to the right of 「계획 저장」 completes all sets or undoes all completions (CheckCheck ↔ ListRestart).

## Git
- Branch: `main`
- Commit: e55ae1bb

## Test focus
1. Machine card / records history performance header: icon right of plan-save.
2. Incomplete → tap → all sets complete + silent save.
3. All complete → red restart icon → undo all.
4. No button text; tooltip/aria explain action.

## Fast checks
```bash
rg -n "allSetsCompleteAria|history-workout-log__all-complete|CheckCheck" frontend/src
```

## as-is → to-be
- **as-is:** Per-set complete only.
- **to-be:** One icon toggle for all-complete / undo-all beside plan save.
