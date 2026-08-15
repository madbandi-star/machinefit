# Test handoff — Deduplicate brand in machine labels

## Summary
Common/standard machines whose names already include the brand no longer get `Brand ·` prefixed again on records (and other branded label surfaces).

## Git
- Branch: `main`
- Commit: _2ab0b034_

## Test focus
1. Records: common equipment title shows brand once
2. Non-prefixed machine names still get `Brand · Name`

## As-is → To-be
- **As-is:** Arsenal Strength · Arsenal Strength 45 Leg Press
- **To-be:** Arsenal Strength 45 Leg Press
