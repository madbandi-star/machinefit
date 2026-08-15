# Test handoff — Calendar muscle labels mobile fix

## Summary
Mobile calendar showed counts only because muscle names flex-shrunk to zero. Compact inline labels + fixed day height + max 2 lines.

## Git
- Branch: `main`
- Commit: _23c756fd_

## Test focus
1. Mobile: muscle name visible with count
2. Multi-muscle days do not stretch the month grid
3. Desktop still OK

## As-is → To-be
- **As-is:** Mobile count-only; uneven tall cells
- **To-be:** Name+count; uniform fixed cells
