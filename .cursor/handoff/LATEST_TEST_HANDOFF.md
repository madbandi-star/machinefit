# Test handoff: Home fortune defaults collapsed

## Summary
Home ??? ???? defaults to collapsed when no saved preference. UI only.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. Clear `machinefit.homeFortuneExpanded` (or fresh browser)
2. Card opens collapsed
3. Expand ? reload still expanded (preference saved)

## Fast checks
```bash
rg -n "if \\(raw === null\\) return false" frontend/src/components/home/HomeFortuneCard/HomeFortuneCard.tsx
```

## As-is ? To-be
- **As-is**: Default open
- **To-be**: Default collapsed
