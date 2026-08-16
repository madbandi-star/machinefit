# Test handoff — Search brand-filter empty state polish

## Summary
When the search page has no favorite brands, the empty area is now a compact gold-star action row (tappable) instead of a dashed box with long copy.

## Git
- Branch: `main`
- Commit: (filled after push)

## Changed files
- `frontend/src/pages/machine-search/MachineSearchPage.tsx`
- `frontend/src/styles/machines.css`
- `frontend/src/i18n/locales/{ko,en,ja,zh}/machines.json`

## Test focus
1. Logged-in, zero brand favorites → brand filter empty row visible.
2. Tap row → Brand favorites.
3. With favorites → chips unchanged.

## Fast checks
```bash
rg -n "brand-filter-empty|filterEmptyCta" frontend/src/pages/machine-search/MachineSearchPage.tsx frontend/src/styles/machines.css frontend/src/i18n/locales/ko/machines.json
```

## as-is → to-be
| as-is | to-be |
| --- | --- |
| Dashed box + long hint + button | Compact star row + short copy + Add |

## Deploy
Frontend Pages only.
