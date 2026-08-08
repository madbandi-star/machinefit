# Test handoff: Date picker defaults to next day

## Summary
Plan date picker default is no longer the card’s current date. Move/copy uses **card date + 1 day**; missed-plan change uses **tomorrow**.

## Git
- Branch: `main`
- Commit: `2bef5dd4`

## Test focus
1. Card → 날짜 변경 / 복사 → default shows next day after that card
2. Missed banner → 날짜 변경 → default tomorrow

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Default = card date (e.g. 08-06) | Default = next day |
