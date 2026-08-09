# Test handoff: Remove fortune guide + data sections

## Summary
Removed ???? ?? ???? and ???? ? ?? ?????? from fortune today. Apply section kept. UI only.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. `/fortune/today` has no guide / my-data blocks
2. Remaining flow: hero ? energy/base ? story ? luck ? apply ? disclaimer

## Fast checks
```bash
rg -n "FortuneGuideSection|FortuneDataSection" frontend/src/components/fortune
```

## As-is ? To-be
- **As-is**: Guide + data sections on fortune page
- **To-be**: Those sections removed
